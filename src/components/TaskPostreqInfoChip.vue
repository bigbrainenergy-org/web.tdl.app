<template>
  <q-item-section v-if="taskIncompletePostreqLength" side>
    <q-chip v-if="taskPostreqInfoView === 'Quantity'" :style="taskPostreqColor">
      {{ taskIncompletePostreqLength }}
    </q-chip>
    <div v-if="taskPostreqInfoView === 'Strict'">
      <!-- <q-icon v-if="(task.procedure_ids ?? []).length" class="q-pr-sm" name="repeat" color="gray" /> -->
      <q-icon v-if="taskIncompletePostreqLength > strictModeMaxPostreqs" name="warning" color="red" />
      <q-icon v-if="taskIncompletePostreqLength <= strictModeMaxPostreqs && taskIncompletePostreqLength > 0" name="rocket_launch" />
    </div>
  </q-item-section>
</template>
<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { usePostreqWarning } from 'src/composables/use-postreq-warning'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import type { Task } from 'src/stores/tasks/task-model'
  import { computed } from 'vue'

  interface Prop {
    task: Task
  }
  const props = defineProps<Prop>()
  const { taskPostreqInfoView, strictModeMaxPostreqs } = storeToRefs(useLocalSettingsStore())
  const taskIncompletePostreqLength = computed(() => props.task.incomplete_postreqs.length)
  const taskPostreqColor = computed(
    () => taskIncompletePostreqLength.value > postreqQuantityWarningThreshold.value
      ? 'background-color: red;'
      : 'background-color: gray;'
  )
  const { postreqQuantityWarningThreshold } = usePostreqWarning()
</script>