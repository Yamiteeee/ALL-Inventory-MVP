<script setup>
import { RouterLink } from 'vue-router'
import { LANDING_UI } from './landingConfig'

// Lucide Vue Next Icons
import { Package, Layers, ShieldCheck, ShoppingCart, ArrowRight, LogIn } from 'lucide-vue-next'

const iconMap = {
  Layers,
  ShieldCheck,
  ShoppingCart,
}
</script>

<template>
  <div class="landing-viewport">
    <div class="landing-shell">
      <!-- Top Navigation -->
      <header class="top-nav">
        <div class="brand">
          <div class="icon-disc">
            <Package :size="16" stroke-width="2.2" />
          </div>
          <span class="brand-name">{{ LANDING_UI.nav.brand }}</span>
        </div>

        <RouterLink to="/login" class="btn btn-secondary">
          <LogIn :size="14" stroke-width="2.2" />
          <span>{{ LANDING_UI.nav.portalButton }}</span>
        </RouterLink>
      </header>

      <!-- Hero Section -->
      <main class="hero-section">
        <span class="eyebrow-pill">{{ LANDING_UI.hero.badge }}</span>
        <h1 class="hero-title">{{ LANDING_UI.hero.title }}</h1>
        <p class="hero-subtitle">{{ LANDING_UI.hero.subtitle }}</p>

        <div class="cta-group">
          <RouterLink to="/login" class="btn btn-action-primary">
            <span>{{ LANDING_UI.hero.ctaPrimary }}</span>
            <ArrowRight :size="15" stroke-width="2.2" />
          </RouterLink>
          <RouterLink to="/login" class="btn btn-secondary">
            <span>{{ LANDING_UI.hero.ctaSecondary }}</span>
          </RouterLink>
        </div>
      </main>

      <!-- Feature Cards Grid -->
      <section class="features-grid">
        <article v-for="feature in LANDING_UI.features" :key="feature.title" class="feature-card">
          <div class="feature-icon-wrapper">
            <component :is="iconMap[feature.icon]" :size="18" stroke-width="2.2" />
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-desc">{{ feature.description }}</p>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped src="./LandingView.css"></style>
