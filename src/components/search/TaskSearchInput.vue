<template>
  <div class="row q-col-gutter-sm items-center">
    <div class="col">
      <q-input
        v-model="search"
        filled
        clearable
        :debounce="debounce"
        :label="searchLabel"
        autofocus
        @update:model-value="emit('doASearch')"
        @keyup.enter="emit('createTask', search)"
      >
        <template #append>
          <q-btn round flat dense icon="search" @click="emit('doASearch')" />
        </template>
      </q-input>
    </div>
    <div v-if="showAllCheckbox && search?.length" class="col-auto">
      <q-checkbox
        v-model="searchAllTasks"
        label="All"
        dense
        @update:model-value="emit('doASearch')"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
  const search = defineModel<string | undefined>({ required: true })
  const searchAllTasks = defineModel<boolean>('searchAllTasks', { default: false })
  const emit = defineEmits(['doASearch', 'createTask'])

  withDefaults(defineProps<{
    searchLabel: string
    debounce: number
    showAllCheckbox?: boolean
  }>(), {
    showAllCheckbox: false
  })
</script>
