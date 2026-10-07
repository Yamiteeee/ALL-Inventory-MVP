<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="landing-container">
    <nav class="landing-nav">
      <div class="brand">📦 StockFlow</div>
      <RouterLink to="/login" class="btn-secondary">Employee Portal</RouterLink>
    </nav>

    <main class="hero">
      <span class="badge-tag">MVP Edition</span>
      <h1>Real-Time Inventory Control Made Simple</h1>
      <p class="hero-subtitle">
        Monitor product counts, track low-stock thresholds, and manage incoming and outgoing units
        directly from a centralized workspace.
      </p>

      <div class="cta-group">
        <RouterLink to="/login" class="btn-primary">Employee Login →</RouterLink>
      </div>
    </main>

    <section class="features-grid">
      <div class="feature-card">
        <h3>⚡ Real-Time Tracking</h3>
        <p>Instant reactivity for in-memory stock increments and decrements.</p>
      </div>
      <div class="feature-card">
        <h3>⚠️ Low Stock Alerts</h3>
        <p>Color-coded status pills automatically flag low quantities.</p>
      </div>
      <div class="feature-card">
        <h3>🔍 Instant SKU Search</h3>
        <p>Filter hundreds of warehouse units by product name, SKU, or category.</p>
      </div>
    </section>
  </div>
</template>

<style scoped src="./LandingView.css"></style>
