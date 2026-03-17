<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 500px">
      <q-card-section class="bg-primary text-white">
        <div class="row items-center">
          <div class="text-h6 col">Manage Schedules</div>
          <q-btn flat round icon="fas fa-times" @click="onDialogCancel" />
        </div>
      </q-card-section>

      <q-card-section>
        <q-btn
          color="primary"
          icon="fas fa-plus"
          label="Create Schedule"
          class="full-width q-mb-md"
          @click="onCreate"
        />

        <div v-if="schedules.length === 0" class="text-grey-5 text-center q-pa-lg">
          No schedules yet. Create one to get started.
        </div>

        <q-list v-else separator>
          <q-item v-for="schedule in schedules" :key="schedule.id">
            <q-item-section>
              <q-item-label>
                {{ schedule.title }}
                <q-badge v-if="schedule.default" color="primary" class="q-ml-sm">Default</q-badge>
              </q-item-label>
              <q-item-label caption>
                {{ schedule.blocks.length }} block{{ schedule.blocks.length === 1 ? '' : 's' }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row q-gutter-xs">
                <q-btn flat round dense icon="fas fa-pencil" color="primary" @click="onEdit(schedule)" />
                <q-btn flat round dense icon="fas fa-trash" color="negative" @click="onDelete(schedule)" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { useDialogPluginComponent, useQuasar } from 'quasar'
  import { computed } from 'vue'
  import { useRepo } from 'pinia-orm'
  import { Schedule, ScheduleRepo } from 'src/stores/schedules/schedule'
  import { openScheduleEditorDialog } from 'src/utils/dialog-utils'
  import { handleError, notifySuccess } from 'src/utils/notification-utils'

  const emit = defineEmits([...useDialogPluginComponent.emits])
  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

  const $q = useQuasar()
  const schedulesRepo = useRepo(ScheduleRepo)
  const schedules = computed(() => schedulesRepo.all())

  function onCreate() {
    openScheduleEditorDialog()
  }

  function onEdit(schedule: Schedule) {
    openScheduleEditorDialog(schedule)
  }

  function onDelete(schedule: Schedule) {
    $q.dialog({
      title: 'Delete Schedule',
      message: `Are you sure you want to delete "${schedule.title}"?`,
      cancel: true,
      persistent: true
    }).onOk(async () => {
      await schedulesRepo.delete(schedule.id).then(() => {
        notifySuccess('Schedule deleted')
      }, handleError('Error deleting schedule'))
    })
  }
</script>
