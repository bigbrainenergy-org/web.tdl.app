<template>
  <q-card class="full-height" style="background-color: #1d1d1df6">
    <q-card-actions v-if="$slots.actions">
      <slot name="actions"></slot>
    </q-card-actions>

    <q-card-section v-if="$slots.header" class="bg-primary text-white">
      <div class="row items-center">
        <div class="col">
          <slot name="header"></slot>
        </div>
      </div>
    </q-card-section>

    <q-card-section>
      <slot name="body"></slot>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts"></script>
