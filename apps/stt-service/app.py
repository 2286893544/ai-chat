import os
import subprocess
from functools import lru_cache
from tempfile import NamedTemporaryFile
from typing import Any, Literal, Optional

os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Chat STT Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@lru_cache(maxsize=3)
def get_whisper_model(model_name: str) -> Any:
    from faster_whisper import WhisperModel

    return WhisperModel(model_name, device="cpu", compute_type="int8")


@lru_cache(maxsize=1)
def get_funasr_model() -> Any:
    from funasr import AutoModel

    return AutoModel(
        model="paraformer-zh",
        model_revision="v2.0.4",
        vad_model="fsmn-vad",
        vad_model_revision="v2.0.4",
        vad_kwargs={"max_single_segment_time": 60000},
        punc_model="ct-punc",
        punc_model_revision="v2.0.4",
        disable_update=True,
        disable_pbar=True,
        log_level="ERROR",
        device="cpu",
    )


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "hf_endpoint": os.environ.get("HF_ENDPOINT", ""),
        "disable_xet": os.environ.get("HF_HUB_DISABLE_XET", ""),
        "providers": ["faster-whisper", "funasr"],
    }


def format_error(exc: Exception, provider: str) -> str:
    message = str(exc)
    if provider == "funasr":
        if "ffmpeg" in message.lower():
            return (
                "本地 FunASR 音频解码失败：缺少可用 ffmpeg。"
                "请在 apps/stt-service 下执行 uv sync 后重启 STT 服务。"
            )
        if "No module named" in message:
            return (
                "本地 FunASR 依赖未安装。请在 apps/stt-service 下执行 "
                "uv sync，安装 funasr/modelscope/torch 等依赖后重启 STT 服务。"
            )
        if "model" in message.lower() or "download" in message.lower():
            return (
                "本地 FunASR 模型未下载或加载失败。请确认网络可访问 ModelScope，"
                "首次使用会下载 paraformer-zh、fsmn-vad 和 ct-punc 模型。"
            )
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


def extract_funasr_text(result: Any) -> str:
    if isinstance(result, list) and result:
        first = result[0]
        if isinstance(first, dict):
            return str(first.get("text") or first.get("sentence") or "").strip()
        return str(first).strip()
    if isinstance(result, dict):
        return str(result.get("text") or result.get("sentence") or "").strip()
    return str(result or "").strip()


def transcribe_with_faster_whisper(audio_path: str, model: str, language: Optional[str]) -> str:
    whisper = get_whisper_model(model)
    segments, _info = whisper.transcribe(
        audio_path,
        language=language or None,
        beam_size=5,
        vad_filter=True,
    )
    return "".join(segment.text for segment in segments).strip()


def transcribe_with_funasr(audio_path: str) -> str:
    model = get_funasr_model()
    result = model.generate(
        input=audio_path,
        cache={},
        batch_size_s=60,
        hotword="",
    )
    return extract_funasr_text(result)


def convert_audio_to_wav(input_path: str, output_path: str) -> None:
    import imageio_ffmpeg

    ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
    result = subprocess.run(
        [
            ffmpeg_path,
            "-y",
            "-i",
            input_path,
            "-ar",
            "16000",
            "-ac",
            "1",
            "-f",
            "wav",
            output_path,
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    if result.returncode != 0:
        detail = result.stderr.strip().splitlines()[-1] if result.stderr.strip() else "unknown ffmpeg error"
        raise RuntimeError(f"ffmpeg audio conversion failed: {detail}")


@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    provider: Literal["faster-whisper", "funasr"] = Form("faster-whisper"),
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

            if provider == "funasr":
                with NamedTemporaryFile(suffix=".wav", delete=True) as wav_tmp:
                    convert_audio_to_wav(tmp.name, wav_tmp.name)
                    text = transcribe_with_funasr(wav_tmp.name)
                    return {"text": text, "provider": "funasr", "model": "paraformer-zh"}

            text = transcribe_with_faster_whisper(tmp.name, model, language)
            return {"text": text, "provider": "faster-whisper", "model": model}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=format_error(exc, provider)) from exc
