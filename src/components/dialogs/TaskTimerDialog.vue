<template>
  <q-dialog
    ref="dialogRef"
    backdrop-filter="blur(4px)"
    @hide="cancel"
  >
    <q-card v-if="task" class="q-dialog-plugin text-center">
      <q-bar style="background-color: #333333">
        <div>TASK TIMER</div>
        <q-space />
        <q-btn
          dense
          flat
          outline
          icon="fa fa-thumbtack"
          class="q-pr-sm"
          @click="minimize()"
          @touchstart.stop
          @mousedown.stop
        />
      </q-bar>
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
          @click="openTaskBreakdownDialog(task)?.onDismiss(handleOKCancelOfAddPre).onCancel(handleOKCancelOfAddPre)"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useDialogPluginComponent } from 'quasar'
  import { useTaskTimerStore } from 'src/stores/tasks/task-timer'
  import { openTaskBreakdownDialog, considerOpeningQuickSortDialog } from 'src/utils/dialog-utils'
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

  const { minimized, timeRemaining, task, timer } = storeToRefs(useTaskTimerStore())
  const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
  const emit = defineEmits([...useDialogPluginComponent.emits])
  if(task.value === null) throw Error('task is null')
  const estDuration = (task.value.task_duration_in_minutes ?? 15)*60
  timeRemaining.value = estDuration
  const progressValue = computed(() => 100 * timeRemaining.value / estDuration)
  const zeroPad = (num: number, places: number) => String(num).padStart(places, '0')
  const mmss = (x: number) => `${Math.floor(x/60)}:${zeroPad(Math.floor(x)%60, 2)}`
  const prettyProgressValue = computed(() => mmss(timeRemaining.value)) // what the fuck?!
  const expired = ref(false)

  onBeforeUnmount(() => {
    if(!minimized.value) useTaskTimerStore().resetTimer()
  })

  const cancel = () => {
    if(minimized.value) return
    // Make sure the timer is cleared before hiding the dialog
    if (timer.value) {
      console.log('cleared interval: canceled timer dialog')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      clearInterval(timer.value)
      timer.value = null
    }
    onDialogHide()
  }

  const markComplete = () => {
    task.value!.toggleCompleted()
    cancel()
  }

  const handleOKCancelOfAddPre = () => {
    cancel()
    considerOpeningQuickSortDialog()
  }

  const minimize = () => {
    minimized.value = true
    onDialogOK()
  }
</script>