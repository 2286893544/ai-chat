import os
from functools import lru_cache
from tempfile import NamedTemporaryFile
from typing import Optional

os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

app = FastAPI(title="AI Chat STT Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@lru_cache(maxsize=3)
def get_model(model_name: str) -> WhisperModel:
    return WhisperModel(model_name, device="cpu", compute_type="int8")


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "hf_endpoint": os.environ.get("HF_ENDPOINT", ""),
        "disable_xet": os.environ.get("HF_HUB_DISABLE_XET", ""),
    }


def format_error(exc: Exception) -> str:
    message = str(exc)
    if "No route to host" in message or "locate the files on the Hub" in message:
        return (
            "本地 faster-whisper 无法下载模型。默认已使用 hf-mirror.com，"
            "请确认网络可访问该镜像，或手动设置 HF_ENDPOINT/预下载模型后重试。"
        )
    if "CAS" in message or "xethub" in message or "401 Unauthorized" in message:
        return (
            "本地 faster-whisper 下载模型时走到了 HuggingFace Xet/CAS 鉴权链路并失败。"
            "已配置 HF_HUB_DISABLE_XET=1，请重启 STT 服务后重试；"
            "如果仍失败，需要删除未完成的模型缓存后重新下载。"
        )
    return message


@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    model: str = Form("base"),
    language: Optional[str] = Form("zh"),
) -> dict[str, str]:
    suffix = ".webm"
    if file.filename and "." in file.filename:
        suffix = "." + file.filename.rsplit(".", 1)[1]

    try:
        with NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
            tmp.write(await file.read())
            tmp.flush()

            whisper = get_model(model)
            segments, _info = whisper.transcribe(
                tmp.name,
                language=language or None,
                beam_size=5,
                vad_filter=True,
            )
            text = "".join(segment.text for segment in segments).strip()
            return {"text": text, "provider": "faster-whisper", "model": model}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=format_error(exc)) from exc
