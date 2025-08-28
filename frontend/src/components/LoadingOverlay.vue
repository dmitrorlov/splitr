<script lang="ts" setup>
interface Props {
  show: boolean
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: 'Loading...',
})
</script>

<template>
    <transition name="overlay-fade">
        <div
            v-if="show"
            class="loading-overlay"
            @click.prevent
            @keydown.prevent
            @contextmenu.prevent
        >
            <div class="loading-content">
                <div class="loading-spinner">
                    <div class="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
                </div>
                <p class="loading-message">{{ message }}</p>
            </div>
        </div>
    </transition>
</template>

<style scoped>
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(2px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: wait;
}

.loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
}

.loading-message {
    color: white;
    font-size: 1.1rem;
    font-weight: 500;
    text-align: center;
    margin: 0;
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
    transition: opacity 0.3s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
    opacity: 0;
}
</style>
