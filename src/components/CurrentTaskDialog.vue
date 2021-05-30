<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" :maximized="true">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Task Details</div>
        <template v-if="currentTask.completed_at == null">
          <q-btn class="q-ma-sm" size="md" color="positive" label="Mark Complete" @click="markTaskComplete(currentTask)" />
        </template>
        <template v-else>
          <q-btn class="q-ma-sm" size="md" color="primary" label="Mark Incomplete" @click="markTaskIncomplete(currentTask)" />
        </template>
        <q-btn class="q-ma-sm" size="md" color="negative" label="Delete" @click="deleteTask(currentTask)" />
        <q-btn class="q-ma-sm" size="md" color="grey" label="Close" @click="onCancelClick" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12 col-md">
            <div class="text-h4 text-primary">{{ currentTask.title }}</div>
            <br>
            <q-input
              v-model="editTaskTitle"
              filled
              label="Task title"
              :placeholder="currentTask.title"
              @keyup.enter="updateTaskTitle"
              clearable
            />
            <br>
            <q-select
              v-model="selectedTags"
              filled
              use-chips
              multiple
              clearable
              @update:model-value="updateTaskTags"
              :options="tags"
              option-value="id"
              option-label="title"
              label="Tags"
            />
            <br>
            <q-select
              v-model="selectedList"
              filled
              @update:model-value="updateTaskList"
              :options="lists"
              option-value="id"
              option-label="title"
              label="List"
            />
            <br>
            <q-datetime-input
              v-model="editTaskReviewAt"
              @update:model-value="updateTaskReviewAt"
              label="Review at"
            />
            <br>
            <q-datetime-input
              v-model="editTaskRemindMeAt"
              @update:model-value="updateTaskRemindMeAt"
              label="Remind me at"
            />
            <br>
            <q-datetime-input
              v-model="editTaskPrioritizeAt"
              @update:model-value="updateTaskPrioritizeAt"
              label="Prioritize at"
            />
            <br>
            <q-datetime-input
              v-model="editTaskDeadlineAt"
              @update:model-value="updateTaskDeadlineAt"
              label="Deadline at"
            />
            <br>
            <q-input
              v-model="editTaskNotes"
              filled
              autogrow
              @update:model-value="updateTaskNotes"
              debounce="1000"
              label="Notes"
            />
          </div>
          <div class="col-12 col-md">
            <div class="row">
              <div class="col">
                <div class="text-h5">Prerequisites</div>
              </div>
              <div class="col text-right">
                <q-btn color="primary" icon="fas fa-link" label="Add Prerequisite" @click="openPrerequisiteDialog" />
              </div>
            </div>
            <q-list class="q-my-md">
              <q-item clickable v-ripple v-if="!currentTask.prereqs.length">
                <q-item-section>No prerequisites</q-item-section>
              </q-item>
              <q-item
                clickable
                v-ripple
                v-for="pre in currentTask.prereqs"
                :key="pre.id"
                @click="setCurrentTask(pre)"
              >
                <q-item-section>
                  {{ pre.title }}
                  <div>
                    <q-chip
                      clickable
                      v-for="tag in pre.tags"
                      :key="tag.id"
                      icon="local_offer"
                      :style="'color: ' + textColor(tag.color) + '; background-color: ' + tag.color"
                    >
                      {{ tag.title }}
                    </q-chip>
                  </div>
                </q-item-section>

                <q-item-section avatar>
                  <q-btn round color="negative" icon="fas fa-unlink" @click.stop="removePrereq(pre)" />
                </q-item-section>
              </q-item>
            </q-list>
            <div class="row">
              <div class="col">
                <div class="text-h5">Postrequisites</div>
              </div>
              <div class="col text-right">
                <q-btn color="primary" icon="fas fa-link" label="Add Postrequisite" @click="openPostrequisiteDialog" />
              </div>
            </div>
            <q-list class="q-my-md">
              <q-item clickable v-ripple v-if="!currentTask.postreqs.length">
                <q-item-section>No postrequisites</q-item-section>
              </q-item>
              <q-item
                clickable
                v-ripple
                v-for="post in currentTask.postreqs"
                :key="post.id"
                @click="setCurrentTask(post)"
              >
                <q-item-section>
                  {{ post.title }}
                  <div>
                    <q-chip
                      clickable
                      v-for="tag in post.tags"
                      :key="tag.id"
                      icon="local_offer"
                      :style="'color: ' + textColor(tag.color) + '; background-color: ' + tag.color"
                    >
                      {{ tag.title }}
                    </q-chip>
                  </div>
                </q-item-section>

                <q-item-section avatar>
                  <q-btn round color="negative" icon="fas fa-unlink" @click.stop="removePostreq(post)" />
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
import QDatetimeInput from 'components/QDatetimeInput.vue';
import TaskSearchDialog from 'components/TaskSearchDialog.vue';
import {
  defineComponent,
  PropType,
  computed,
  ref,
  toRef,
  Ref,
} from 'vue';
import List from '../models/list'
import Task from '../models/task'
import Tag from '../models/tag'
import { useQuasar } from 'quasar'
import { useStore } from '../store'
import { errorNotification } from '../hackerman/ErrorNotification'
import { textColor } from '../hackerman/TextColor'
import { scheduleTaskNotification, cancelTaskNotification } from '../hackerman/ScheduledNotifications'

export default {
  components: { QDatetimeInput },

  props: {
    task: {
      type: Object,
      required: true
    }
  },

  emits: [
    // REQUIRED; need to specify some events that your
    // component will emit through useDialogPluginComponent()
    ...useDialogPluginComponent.emits
  ],

  setup (props) {
    // REQUIRED; must be called inside of setup()
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
    // dialogRef      - Vue ref to be applied to QDialog
    // onDialogHide   - Function to be used as handler for @hide on QDialog
    // onDialogOK     - Function to call to settle dialog with "ok" outcome
    //                    example: onDialogOK() - no payload
    //                    example: onDialogOK({ /*.../* }) - with payload
    // onDialogCancel - Function to call to settle dialog with "cancel" outcome

    const $q = useQuasar()
    const $store = useStore()

    const currentTask = ref(props.task)
    const editTaskTitle = ref(currentTask.value.title)
    const editTaskNotes = ref(currentTask.value.notes)
    const editTaskReviewAt = ref(currentTask.value.review_at)
    const editTaskRemindMeAt = ref(currentTask.value.remind_me_at)
    const editTaskPrioritizeAt = ref(currentTask.value.prioritize_at)
    const editTaskDeadlineAt = ref(currentTask.value.deadline_at)
    const selectedList = ref({ id: currentTask.value.list.id, title: currentTask.value.list.title })
    let temp = currentTask.value.tags.map(
      (tag) => {
        let temp = { id: tag.id, title: tag.title }
        return temp
      }
    )
    const selectedTags = ref([])
    selectedTags.value = temp

    const lists = computed({
      get: () => $store.$repo(List).with('tasks').orderBy('order').orderBy('title').get()
    })

    const tags = computed({
      get: () => $store.$repo(Tag).orderBy('order').orderBy('title').get()
    })

    function setCurrentTask(newTask) {
      currentTask.value = $store.$repo(Task).
        with('list').
        with('prereqs', (query) => { query.with('tags') }).
        with('postreqs', (query) => { query.with('tags') }).
        with('tags').
        find(newTask.id)
      editTaskTitle.value = currentTask.value.title
      editTaskNotes.value = currentTask.value.notes
      editTaskReviewAt.value = currentTask.value.review_at
      editTaskRemindMeAt.value = currentTask.value.remind_me_at
      editTaskPrioritizeAt.value = currentTask.value.prioritize_at
      editTaskDeadlineAt.value = currentTask.value.deadline_at
      selectedList.value = { id: currentTask.value.list.id, title: currentTask.value.list.title }
      selectedTags.value = currentTask.value.tags.map(
        (tag) => {
          let temp = { id: tag.id, title: tag.title }
          return temp
        }
      )
    }

    function markTaskComplete(task) {
      $store.dispatch('tasks/markComplete', { id: task.id }).
      then(
        (response) => {
          onDialogOK()
        },
        (error) => {
          errorNotification(error, 'Failed to mark task as complete')
        }
      )
    }

    function markTaskIncomplete(task) {
      $store.dispatch('tasks/markIncomplete', { id: task.id }).
      then(
        (response) => {
          onDialogOK()
        },
        (error) => {
          errorNotification(error, 'Failed to mark task as incomplete')
        }
      )
    }

    function deleteTask(task) {
      $q.dialog({
        title: `Delete task: "${task.title}"`,
        message: 'This cannot be undone! Are you sure?',
        ok: {
          label: 'Delete',
          color: 'negative'
        },
        cancel: {
          color: 'grey'
        }
      }).onOk(() => {
        $store.dispatch('tasks/delete', { id: task.id }).
        then(
          (response) => {
            onDialogOK()
          },
          (error) => {
            errorNotification(error, 'Failed to delete task')
          }
        )
      })
    }

    function updateTaskTitle() {
      if (editTaskTitle.value === currentTask.value.title) { return }

      $store.dispatch('tasks/update', {
        id: currentTask.value.id,
        title: editTaskTitle.value
      }).
      then(
        (response) => {
          setCurrentTask(currentTask.value)
        },
        (error) => {
          errorNotification(error, 'Failed to update task title')
        }
      )
    }

    function updateTaskTags() {
      $store.dispatch('tasks/updateTags', {
        id: currentTask.value.id,
        tags: selectedTags.value
      }).
      then(
        (response) => {
          setCurrentTask(currentTask.value)
        },
        (error) => {
          errorNotification(error, 'Failed to update task tags')
        }
      )
    }

    function updateTaskList() {
      $store.dispatch('tasks/updateList', {
        id: currentTask.value.id,
        list_id: selectedList.value.id
      }).
      then(
        (response) => {
          setCurrentTask(currentTask.value)
        },
        (error) => {
          errorNotification(error, 'Failed to update task list')
        }
      )
    }

    function updateTaskNotes() {
      if (editTaskNotes.value === currentTask.value.notes) { return }

      $store.dispatch('tasks/update', {
        id: currentTask.value.id,
        notes: editTaskNotes.value
      }).
      then(
        (response) => {
          setCurrentTask(currentTask.value)
        },
        (error) => {
          errorNotification(error, 'Failed to update task notes')
        }
      )
    }

    function updateTaskReviewAt() {
      if (editTaskReviewAt.value === currentTask.value.review_at) { return }

      $store.dispatch('tasks/update', {
        id: currentTask.value.id,
        review_at: editTaskReviewAt.value
      }).
      then(
        (response) => {
          setCurrentTask(currentTask.value)
        },
        (error) => {
          errorNotification(error, 'Failed to update task review at')
        }
      )
    }

    function updateTaskRemindMeAt() {
      if (editTaskRemindMeAt.value === currentTask.value.remind_me_at) { return }

      $store.dispatch('tasks/update', {
        id: currentTask.value.id,
        remind_me_at: editTaskRemindMeAt.value
      }).
      then(
        (response) => {
          setCurrentTask(currentTask.value)
          // Do this after we refresh current task, otherwise value will be outdated
          if (currentTask.value.remind_me_at) {
            scheduleTaskNotification(currentTask.value)
          } else {
            cancelTaskNotification(currentTask.value)
          }
        },
        (error) => {
          errorNotification(error, 'Failed to update task remind me at')
        }
      )
    }

    function updateTaskPrioritizeAt() {
      if (editTaskPrioritizeAt.value === currentTask.value.prioritize_at) { return }

      $store.dispatch('tasks/update', {
        id: currentTask.value.id,
        prioritize_at: editTaskPrioritizeAt.value
      }).
      then(
        (response) => {
          setCurrentTask(currentTask.value)
        },
        (error) => {
          errorNotification(error, 'Failed to update task prioritize at')
        }
      )
    }

    function updateTaskDeadlineAt() {
      if (editTaskDeadlineAt.value === currentTask.value.deadline_at) { return }

      $store.dispatch('tasks/update', {
        id: currentTask.value.id,
        deadline_at: editTaskDeadlineAt.value
      }).
      then(
        (response) => {
          setCurrentTask(currentTask.value)
        },
        (error) => {
          errorNotification(error, 'Failed to update task deadline at')
        }
      )
    }

    function openPrerequisiteDialog() {
      $q.dialog({
        component: TaskSearchDialog,

        componentProps: {
          dialogTitle: 'Add Prerequisite',
          task: currentTask.value,
          excludeFromSearch: [currentTask.value],
          onCreate: (payload) => { createPrereq(payload) },
          onSelect: (payload) => { addPrereq(payload) }
        }
      })
    }

    function openPostrequisiteDialog() {
      $q.dialog({
        component: TaskSearchDialog,

        componentProps: {
          dialogTitle: 'Add Postrequisite',
          task: currentTask.value,
          excludeFromSearch: [currentTask.value],
          onCreate: (payload) => { createPostreq(payload) },
          onSelect: (payload) => { addPostreq(payload) }
        }
      })
    }

    function createPrereq(payload) {
      $store.dispatch('tasks/createPrereq', {
        taskOptions: payload.options,
        id: currentTask.value.id
      }).
      then(
        (response) => {
          setCurrentTask(currentTask.value)
          payload.callback()
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Created new prereq',
            icon: 'fas fa-tasks'
          })
        },
        (error) => {
          errorNotification(error, 'Failed to create prereq')
        }
      )
    }

    function addPrereq(payload) {
      $store.dispatch('tasks/addPrereq', {
        id: currentTask.value.id,
        pre_task_id: payload.task.id
      }).
      then(
        (response) => {
          setCurrentTask(currentTask.value)
          // hurr durr I'm a bad javascript programmer, but it works
          payload.callback(payload.task)
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Added Prerequisite',
            icon: 'fas fa-link'
          })
        },
        (error) => {
          errorNotification(error, 'Failed to add prereq')
        }
      )
    }

    function createPostreq(payload) {
      $store.dispatch('tasks/createPostreq', {
        taskOptions: payload.options,
        id: currentTask.value.id
      }).
      then(
        (response) => {
          setCurrentTask(currentTask.value)
          payload.callback()
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Created new postreq',
            icon: 'fas fa-tasks'
          })
        },
        (error) => {
          errorNotification(error, 'Failed to create postreq')
        }
      )
    }

    function addPostreq(payload) {
      $store.dispatch('tasks/addPostreq', {
        id: currentTask.value.id,
        post_task_id: payload.task.id
      }).
      then(
        (response) => {
          setCurrentTask(currentTask.value)
          // hurr durr I'm a bad javascript programmer, but it works
          payload.callback(payload.task)
          $q.notify({
            color: 'positive',
            position: 'top',
            message: 'Added Postrequisite',
            icon: 'fas fa-link'
          })
        },
        (error) => {
          errorNotification(error, 'Failed to add postreq')
        }
      )
    }

    function removePrereq(task) {
      $q.dialog({
        title: 'Remove prerequisite',
        message: 'Are you sure?',
        ok: {
          label: 'Remove',
          color: 'negative'
        },
        cancel: {
          color: 'grey'
        }
      }).onOk(() => {
        $store.dispatch('tasks/removePrereq', {
          id: currentTask.value.id,
          pre_task_id: task.id
        }).
        then(
          (response) => {
            setCurrentTask(currentTask.value)
            $q.notify({
              color: 'positive',
              position: 'top',
              message: 'Removed prerequisite',
              icon: 'fas fa-unlink'
            })
          },
          (error) => {
            errorNotification(error, 'Failed to remove prerequisite')
          }
        )
      })
    }

    function removePostreq(task) {
      $q.dialog({
        title: 'Remove postrequisite',
        message: 'Are you sure?',
        ok: {
          label: 'Remove',
          color: 'negative'
        },
        cancel: {
          color: 'grey'
        }
      }).onOk(() => {
        $store.dispatch('tasks/removePostreq', {
          id: currentTask.value.id,
          post_task_id: task.id
        }).
        then(
          (response) => {
            setCurrentTask(currentTask.value)
            $q.notify({
              color: 'positive',
              position: 'top',
              message: 'Removed postrequisite',
              icon: 'fas fa-unlink'
            })
          },
          (error) => {
            errorNotification(error, 'Failed to remove postrequisite')
          }
        )
      })
    }

    return {
      // Custom stuff
      currentTask,
      editTaskTitle,
      editTaskNotes,
      editTaskReviewAt,
      editTaskRemindMeAt,
      editTaskPrioritizeAt,
      editTaskDeadlineAt,
      selectedList,
      selectedTags,
      lists,
      tags,
      //
      setCurrentTask,
      markTaskComplete,
      markTaskIncomplete,
      updateTaskTitle,
      updateTaskTags,
      updateTaskList,
      updateTaskNotes,
      updateTaskReviewAt,
      updateTaskRemindMeAt,
      updateTaskPrioritizeAt,
      updateTaskDeadlineAt,
      deleteTask,
      //
      openPrerequisiteDialog,
      openPostrequisiteDialog,
      //
      removePrereq,
      removePostreq,
      //
      textColor,

      // This is REQUIRED;
      // Need to inject these (from useDialogPluginComponent() call)
      // into the vue scope for the vue html template
      dialogRef,
      onDialogHide,

      // other methods that we used in our vue html template;
      // these are part of our example (so not required)
      onOKClick () {
        // on OK, it is REQUIRED to
        // call onDialogOK (with optional payload)
        onDialogOK()
        // or with payload: onDialogOK({ ... })
        // ...and it will also hide the dialog automatically
      },

      // we can passthrough onDialogCancel directly
      onCancelClick: onDialogCancel
    }
  }
}
</script>
