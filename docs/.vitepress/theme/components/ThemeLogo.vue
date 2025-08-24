<template>
  <div class="theme-logo">
    <!-- SVG version with customizable colors -->
    <svg 
      v-if="useSvg"
      viewBox="0 0 400 400" 
      class="hero-logo-svg"
      :width="size" 
      :height="size"
    >
      <!-- Geometric network -->
      <g class="network-lines">
        <!-- Add your geometric network paths here -->
        <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" stroke-width="2"/>
        <!-- Add more network elements -->
      </g>
      
      <!-- Network nodes -->
      <g class="network-nodes">
        <!-- Add network node circles -->
        <circle cx="200" cy="50" r="4" />
        <circle cx="350" cy="200" r="4" />
        <!-- Add more nodes -->
      </g>
      
      <!-- PostgreSQL Elephant -->
      <g class="elephant">
        <!-- Add elephant path here -->
        <path d="..." fill="currentColor"/>
      </g>
    </svg>
    
    <!-- Fallback to image with CSS filters -->
    <img 
      v-else
      :src="logoSrc" 
      :alt="alt"
      class="theme-logo-img"
      :width="size"
      :height="size"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: [String, Number],
    default: 200
  },
  alt: {
    type: String,
    default: 'NpgsqlRest Logo'
  },
  useSvg: {
    type: Boolean,
    default: false
  }
})

const logoSrc = computed(() => '/logo2.jpg')
</script>

<style scoped>
.theme-logo {
  display: inline-block;
}

.hero-logo-svg {
  transition: all 0.3s ease;
}

.hero-logo-svg .elephant {
  fill: var(--logo-elephant-color, #3b4db8);
}

.hero-logo-svg .network-lines {
  stroke: var(--logo-network-color, #6c7cb8);
  fill: none;
  stroke-width: 2;
}

.hero-logo-svg .network-nodes {
  fill: var(--logo-network-nodes, #4fc3c8);
}

.theme-logo-img {
  transition: filter 0.3s ease;
  filter: var(--logo-filter, none);
}

/* Theme-specific styling */
:root {
  --logo-filter: brightness(0.9) contrast(1.1);
}

.dark {
  --logo-filter: brightness(1.2) hue-rotate(15deg) saturate(1.1);
}
</style>