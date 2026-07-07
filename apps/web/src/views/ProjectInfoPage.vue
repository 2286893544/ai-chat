<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ projectInfo.name }}</h1>
        <p class="page-subtitle">{{ projectInfo.positioning }}</p>
      </div>
    </div>

    <div class="info-layout">
      <section class="card info-section">
        <div class="card-title">当前能力</div>
        <ul class="info-list">
          <li v-for="item in projectInfo.capabilities" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section class="card info-section">
        <div class="card-title">本地数据</div>
        <ul class="info-list">
          <li v-for="item in projectInfo.localData" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section class="card info-section">
        <div class="card-title">安全提醒</div>
        <ul class="info-list">
          <li v-for="item in projectInfo.safetyNotes" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section class="card info-section">
        <div class="card-title">后续方向</div>
        <ul class="info-list">
          <li v-for="item in projectInfo.roadmap" :key="item">{{ item }}</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { projectInfo } from '../local-data/projectInfo'
</script>

<style scoped>
.page-subtitle {
  margin-top: 6px;
  color: var(--text-secondary);
  font-size: 14px;
}

.info-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.info-section {
  min-height: 220px;
}

.info-list {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
  padding-left: 20px;
}
</style>
