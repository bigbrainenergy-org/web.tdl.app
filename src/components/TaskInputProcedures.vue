<template>
  <q-select
    v-model="selectedProcedures"
    multiple
    filled
    fill-input
    input-debounce="20"
    :options="procedures"
    use-chips
    option-label="title"
    map-options
    emit-value
    label="Procedures"
    use-input
    class="q-my-md text-primary"
    @update:model-value="updateProcedures"
  />
</template>

<script setup lang="ts">
  import { useRepo } from 'pinia-orm'
  import { Procedure, ProcedureRepo } from 'src/stores/procedures/procedure'
  import { Task } from 'src/stores/tasks/task-model'
  import { updateTask } from 'src/utils/task-utils'
  import { computed, ref, watch } from 'vue'

  const task = defineModel<Task>('task', { required: true })

  const selectedProcedures = ref<Procedure[]>(task.value.procedures)

  const procedures = computed(() => useRepo(ProcedureRepo).all())

  const updateProcedures = () => {
    updateTask(task.value.id, { procedure_ids: selectedProcedures.value.map((x) => x.id) })
  }
</script>
