<template>
  <q-dialog
    ref="dialogRef"
    backdrop-filter="blur(4px)"
    @hide="hideDialog"
  >
    <q-card class="q-dialog-plugin text-center">
      <q-card-section :class="expired ? 'bg-red text-white' : 'bg-primary text-white'">
        <div class="text-h6">Task Timer</div>
      </q-card-section>
      <q-card-section class="text-h4">
        {{ task.title }}
      </q-card-section>
      <q-card-section>
        <q-circular-progress :value="progressValue" show-value size="150px">
          {{ prettyProgressValue }}
        </q-circular-progress>
      </q-card-section>
      <q-card-section class="q-ma-lg vertical-top">
        <q-btn
          class="q-ma-lg"
          size="md"
          color="grey"
          label="DONE"
          @click="markComplete"
        />
        <q-btn
          v-if="expired"
          class="q-ma-lg"
          size="md"
          color="grey"
          label="ADD PRES"
          @click="addPrerequisitesDialog(task).onDismiss(handleOKCancelOfAddPre).onCancel(handleOKCancelOfAddPre)"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { useDialogPluginComponent } from 'quasar'
  import type { Task } from 'src/stores/tasks/task-model'
  import { addPrerequisitesDialog, considerOpeningQuickSortDialog } from 'src/utils/dialog-utils'
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

  interface Props {
    task: Task
  }

  const prop = defineProps<Props>()
  const estDuration = (prop.task.task_duration_in_minutes ?? 15)*60
  const remaining = ref(estDuration)
  const progressValue = computed(() => 100 * remaining.value / estDuration)
  const zeroPad = (num: number, places: number) => String(num).padStart(places, '0')
  const mmss = (x: number) => `${Math.floor(x/60)}:${zeroPad(Math.floor(x)%60, 2)}`
  const prettyProgressValue = computed(() => mmss(remaining.value))
  const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
  const emit = defineEmits([...useDialogPluginComponent.emits])

  const expired = ref(false)

  let timer: any = null

  onMounted(() => {
    timer = setInterval(() => {
      if (remaining.value > 0) {
        remaining.value--
      } else {
        expired.value = true
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        clearInterval(timer)
      }
    }, 1000)
  })

  onBeforeUnmount(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if(timer) clearInterval(timer)
  })

  const markComplete = async () => {
    // Clear the timer before completing the task
    if (timer) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      clearInterval(timer)
      timer = null
    }
    await prop.task.toggleCompleted()
    onDialogOK()
  }

  const hideDialog = () => {
    // Make sure the timer is cleared before hiding the dialog
    if (timer) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      clearInterval(timer)
      timer = null
    }
    onDialogHide()
  }

  const handleOKCancelOfAddPre = () => {
    hideDialog()
    considerOpeningQuickSortDialog()
  }
</script>