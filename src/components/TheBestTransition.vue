<template>
  <Transition name="fade-slide" appear>
    <slot />
  </Transition>
</template>
<style>
  .fade-slide-enter-active, .fade-slide-leave-active {
    transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .fade-slide-enter-from, .fade-slide-leave-to {
    opacity: 0;
    transform: translateX(20px);
  }
  .fade-slide-enter-to, .fade-slide-leave-from {
    opacity: 1;
    transform: translateX(0);
  }
</style>