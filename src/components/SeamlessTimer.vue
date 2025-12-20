<template>
  <q-dialog
    ref="dialogRef"
    backdrop-filter="blur(4px)"
    :seamless="minimized"
    :persistent="minimized"
    :position="minimized ? 'top' : 'standard'"
    @hide="cancel"
  >
    <q-card
      v-if="task" class="q-dialog-plugin text-center"
      style="overflow: hidden"
    >
      <q-bar :style="timeRemaining < 10 ? 'background-color: red' : 'background-color: #333333'">
        <q-btn
          dense
          flat
          outline
          icon="fas fa-xmark"
          class="q-pr-sm"
          @click="cancel()"
          @touchstart.stop
          @mousedown.stop
        />
        <q-btn
          dense
          flat
          outline
          :icon="minimized ? 'expand' : 'compress'"
          class="q-pr-sm"
          @click="minimize()"
          @touchstart.stop
          @mousedown.stop
        />
        <q-space />
        <q-btn
          dense
          flat
          icon="fa fa-plus"
          class="q-pr-sm"
          @click="openTaskBreakdownDialog(task)?.onCancel(handleOKCancelOfAddPre).onDismiss(handleOKCancelOfAddPre).onOk(handleOKCancelOfAddPre)"
          @touchstart.stop
          @mousedown.stop
        >
          <q-tooltip anchor="top middle" self="bottom middle" :offset="[7, 7]">
            Add Prerequisites
          </q-tooltip>
        </q-btn>
        <q-btn
          dense
          flat
          outline
          icon="fa fa-check"
          class="q-pr-sm"
          @click="markComplete"
          @touchstart.stop
          @mousedown.stop
        />
      </q-bar>
      <q-card-section :class="minimized ? 'q-py-sm' : 'text-h4'">
        {{ task.title }}
      </q-card-section>
      <q-card-section v-if="!minimized">
        <q-circular-progress :value="progressValue" show-value size="150px" :style="timeRemaining <= 60 ? 'color: red' : undefined" class="q-my-lg">
          {{ prettyProgressValue }}
        </q-circular-progress>
      </q-card-section>
      <q-linear-progress v-if="minimized" :value="1 - (Math.max(progressValue, 0.01) / 100)" :color="timeRemaining <= 60 ? 'red' : 'white'" size="md" />
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
  const progressValue = computed(() => 100 * timeRemaining.value / estDuration)
  const zeroPad = (num: number, places: number) => String(num).padStart(places, '0')
  const mmss = (x: number) => `${Math.floor(x/60)}:${zeroPad(Math.floor(x)%60, 2)}`
  const prettyProgressValue = computed(() => mmss(timeRemaining.value)) // what the fuck?!
  const expired = ref(false)

  onBeforeUnmount(() => {
    if(!minimized.value) useTaskTimerStore().resetTimer()
  })

  const cancel = () => {
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
    if(timeRemaining.value === 0) {
      cancel()
      considerOpeningQuickSortDialog()
    }
  }

  const minimize = () => {
    minimized.value = !minimized.value
  }
</script>