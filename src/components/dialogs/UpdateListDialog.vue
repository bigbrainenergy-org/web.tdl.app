<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 400px">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Edit List</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-input
          v-model="title"
          filled
          label="Title"
          class="q-mb-md"
        />
        <q-select
          v-model="selectedScheduleId"
          filled
          label="Schedule"
          :options="scheduleOptions"
          option-label="title"
          option-value="id"
          emit-value
          map-options
          clearable
          use-input
          input-debounce="20"
          class="q-mb-md"
          @filter="filterSchedules"
        />
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat color="grey" label="Cancel" @click="onDialogCancel" />
        <q-btn
          color="primary"
          label="Save"
          :disable="!title.trim()"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { useDialogPluginComponent } from 'quasar'
  import { ref } from 'vue'
  import { useRepo } from 'pinia-orm'
  import { type List, ListRepo } from 'src/stores/lists/list'
  import { ScheduleRepo } from 'src/stores/schedules/schedule'
  import { handleError, notifySuccess } from 'src/utils/notification-utils'

  const props = defineProps<{
    list: List
  }>()

  const emit = defineEmits([...useDialogPluginComponent.emits])
  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

  const listRepo = useRepo(ListRepo)
  const schedulesRepo = useRepo(ScheduleRepo)

  const title = ref(props.list.title)
  const selectedScheduleId = ref<number | null>(props.list.schedule_id ?? null)

  const allSchedules = schedulesRepo.all()
  const scheduleOptions = ref(allSchedules)

  type voidFn = () => void
  type doneFn = (a: voidFn) => void

  const filterSchedules = (val: string, update: doneFn) => {
    update(() => {
      if (val === '') {
        scheduleOptions.value = allSchedules
      } else {
        const query = val.toLowerCase()
        scheduleOptions.value = allSchedules.filter((x) =>
          x.title.toLowerCase().includes(query)
        )
      }
    })
  }

  async function onSave() {
    await listRepo
      .update({
        id: props.list.id,
        payload: {
          list: {
            title: title.value,
            schedule_id: selectedScheduleId.value
          }
        }
      })
      .then(() => {
        notifySuccess('List updated')
        emit('ok')
      }, handleError('Error updating list'))
  }
</script>
