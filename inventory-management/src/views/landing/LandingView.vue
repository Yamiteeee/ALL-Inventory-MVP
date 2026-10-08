<script setup>
import { RouterLink } from 'vue-router'
import { LANDING_UI } from './landingConfig'
import { useTypewriter } from '@/animations/useTypewriter'
import { usePageEntrance } from '@/animations/usePageEntrance'

import {
  Package,
  Layers,
  ShieldCheck,
  ShoppingCart,
  ArrowRight,
  LogIn,
  Cpu,
  Mail,
  PhoneCall,
} from 'lucide-vue-next'

const iconMap = {
  Layers,
  ShieldCheck,
  ShoppingCart,
}

// 1. Spring physics entrance
usePageEntrance()

// 2. Start typewriter right as the spring finishes its bounce (~450ms)
const { displayedText: heroTitle, isComplete: isTypingDone } = useTypewriter(
  LANDING_UI.hero.title,
  { speed: 28, delay: 450 },
)
</script>

<template>
  <div class="landing-viewport">
    <div class="landing-shell">
      <!-- 1. Top Navigation -->
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

      <!-- 2. Hero Section -->
      <main class="hero-section">
        <div class="hero-content">
          <span class="eyebrow-pill hero-stagger">
            {{ LANDING_UI.hero.badge }}
          </span>

          <!-- Grid Layer: Prevents text-wrap jerking while typing -->
          <h1 class="hero-title hero-stagger">
            <!-- Ghost layout reserve: add a period so space is reserved from frame 1 -->
            <span class="ghost-reserve" aria-hidden="true">{{ LANDING_UI.hero.title }}.</span>

            <span class="typing-active">
              {{ heroTitle }}

              <!-- 1. While typing: classic blinking pipe -->
              <span v-if="!isTypingDone" class="typewriter-cursor" aria-hidden="true">|</span>

              <!-- 2. Finished typing: Dot <-> Heart morphing loop -->
              <span v-else class="morph-period" aria-hidden="true">
                <span class="dot-shape"></span>
                <span class="heart-shape">♥</span>
              </span>
            </span>
          </h1>

          <p class="hero-subtitle hero-stagger">
            {{ LANDING_UI.hero.subtitle }}
          </p>

          <div class="cta-group hero-stagger">
            <RouterLink to="/login" class="btn btn-action-primary">
              <span>{{ LANDING_UI.hero.ctaPrimary }}</span>
              <ArrowRight :size="15" stroke-width="2.2" class="btn-arrow" />
            </RouterLink>

            <RouterLink to="/login" class="btn btn-secondary">
              <span>{{ LANDING_UI.hero.ctaSecondary }}</span>
            </RouterLink>
          </div>
        </div>
      </main>

      <!-- 3. Feature Cards Grid -->
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

    <!-- 4. Full-Width Off-Black Footer -->
    <footer class="landing-footer">
      <div class="footer-container">
        <div class="footer-left">
          <span class="copyright">{{ LANDING_UI.footer.copyright }}</span>
          <div class="tech-stack-row">
            <div class="tech-stack-label">
              <Cpu :size="12" />
              <span>Stack</span>
            </div>
            <div class="tech-tags">
              <span v-for="tech in LANDING_UI.footer.techStack" :key="tech" class="tech-pill">
                {{ tech }}
              </span>
            </div>
          </div>
        </div>

        <div class="footer-right">
          <a :href="`mailto:${LANDING_UI.footer.support.email}`" class="support-link">
            <Mail :size="13" />
            <span>{{ LANDING_UI.footer.support.email }}</span>
          </a>
          <span class="footer-divider">·</span>
          <a :href="`tel:${LANDING_UI.footer.support.hotline}`" class="support-link">
            <PhoneCall :size="13" />
            <span>{{ LANDING_UI.footer.support.hotline }}</span>
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped src="./LandingView.css"></style>
