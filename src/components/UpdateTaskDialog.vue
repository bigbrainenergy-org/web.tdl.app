<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized>
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Task Details</div>
        <template v-if="currentTask.completed !== true">
          <q-btn class="q-ma-sm" size="md" color="positive" label="Mark Complete" />
        </template>
        <template v-else>
          <q-btn class="q-ma-sm" size="md" color="primary" label="Mark Incomplete" />
        </template>
        <q-btn class="q-ma-sm" size="md" color="negative" label="Delete" @click="deleteTask(currentTask.title, currentTask.id!)" />
        <q-btn class="q-ma-sm" size="md" color="grey" label="Close" @click="onCancelClick" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12 col-md">
            <div class="text-h4 text-primary">{{ currentTask.title }}</div>
            <q-input
              v-model="editTitle"
              filled
              label="Task Title"
              :placeholder="currentTask.title"
              @keyup.enter="updateTask({ title: editTitle })"
              clearable
              class="q-my-md"
            />
            <q-select
              v-model="selectedList"
              filled
              hide-selected
              fill-input
              input-debounce="20"
              :options="lists"
              option-label="title"
              map-options
              emit-value
              label="List"
              use-input
              @filter="filterSelection"
              @update:model-value="updateTask({ list_id: selectedList === null ? null : selectedList.id })"
              option-value="id"
              class="q-my-md text-primary"
            />
            <q-datetime-input
              v-model="editRemindMeAt"
              @update:model-value="updateTask({ remind_me_at: editRemindMeAt })"
              label="Remind me at"
              class="q-my-md"
            />
            <q-list>
              <q-item class="q-my-sm">
                <q-item-section side>
                  <q-icon name="far fa-tired" />
                </q-item-section>

                <q-item-section>
                  <div>
                    <!-- <q-badge>Mental Energy Required</q-badge> -->

                    <q-slider
                      v-model="editMentalEnergyRequired"
                      @change="updateTask({ mental_energy_required: editMentalEnergyRequired })"
                      :min="0"
                      :max="100"
                      :step="1"
                      label
                      label-always
                      :label-value="`Mental ${editMentalEnergyRequired}%`"
                      color="blue"
                    />
                  </div>
                </q-item-section>

                <q-item-section side>
                  <q-icon name="fas fa-lightbulb" />
                </q-item-section>
              </q-item>

              <q-item class="q-my-sm">
                <q-item-section side>
                  <q-icon name="far fa-tired" />
                </q-item-section>

                <q-item-section>
                  <div>
                    <!-- <q-badge color="red">Physical Energy Required</q-badge> -->

                    <q-slider
                      v-model="editPhysicalEnergyRequired"
                      @change="updateTask({ physical_energy_required: editPhysicalEnergyRequired })"
                      :min="0"
                      :max="100"
                      :step="1"
                      label
                      label-always
                      :label-value="`Physical ${editPhysicalEnergyRequired}%`"
                      color="red"
                    />
                  </div>
                </q-item-section>

                <q-item-section side>
                  <q-icon name="fas fa-dumbbell" />
                </q-item-section>
              </q-item>
            </q-list>
            <br>
            <q-input
              v-model="editNotes"
              filled
              autogrow
              @update:model-value="updateTask({ notes: editNotes })"
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
              <q-item clickable v-ripple v-if="!allPres.length">
                <q-item-section>No prerequisites</q-item-section>
              </q-item>
              <q-item
                clickable
                v-ripple
                v-for="pre, index in allPres"
                :key="index"
                @click="setCurrentTask(pre as Task)"
              >
                <q-item-section>
                  {{ pre.title }}
                </q-item-section>

                <q-item-section avatar>
                  <q-btn round color="negative" icon="fas fa-unlink" @click.stop="removePrerequisite(pre as Task)" />
                </q-item-section>
              </q-item>
            </q-list>
            <div class="row">
              <div class="col">
                <div class="text-h5">Postrequisites</div>
              </div>
              <div class="col text-right">
                <q-btn color="primary" icon="fas fa-link" label="Add Postrequisite" />
              </div>
            </div>
            <q-list class="q-my-md">
              <q-item clickable v-ripple v-if="!allPosts.length">
                <q-item-section>No postrequisites</q-item-section>
              </q-item>
              <q-item
                clickable
                v-ripple
                v-for="post, index in allPosts"
                :key="index"
                @click="setCurrentTask(post as Task)"
              >
                <q-item-section>
                  {{ post.title }}
                </q-item-section>

                <q-item-section avatar>
                  <q-btn round color="negative" icon="fas fa-unlink" @click.stop="true" />
                </q-item-section>
              </q-item>
            </q-list>
            <div class="row">
              <div class="col">
                <div class="text-h5">Subtasks</div>
              </div>
              <div class="col text-right">
                <q-btn color="primary" icon="fas fa-tasks" label="Add Subtask" />
              </div>
            </div>
            <q-list class="q-my-md">
              <q-item clickable v-ripple>
                <q-item-section>No subtasks</q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { computed, ref } from 'vue';



import QDatetimeInput from 'components/QDatetimeInput.vue';
import TaskSearchDialog from 'components/TaskSearchDialog.vue';

import { ListRepo } from 'src/stores/lists/list';
import { AllOptionalTaskProperties, Task, TaskRepo, UpdateTaskOptions } from 'src/stores/tasks/task';
import { Item, useRepo } from 'pinia-orm';
import { Utils } from 'src/util'

const props = defineProps<{ task: Task }>()

const emit = defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits
])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*.../* }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

const $q = useQuasar()
const listsRepo = useRepo(ListRepo)
const tr = useRepo(TaskRepo)

console.debug('UpdateTaskDialog: task prop value: ', props.task)
const taskID = ref(Utils.hardCheck(props.task.id))
const updatedFlag = ref(false)
const currentTask = ref<Task>(props.task)
const refreshCurrentTask = () => currentTask.value = Utils.hardCheck(tr.withAll().find(props.task.id!))
refreshCurrentTask()
const editTitle = ref(currentTask.value.title)
const editNotes = ref(currentTask.value.notes)
const editRemindMeAt = ref(currentTask.value.remind_me_at)
const editMentalEnergyRequired = ref(currentTask.value.mental_energy_required)
const editPhysicalEnergyRequired = ref(currentTask.value.physical_energy_required)

tr.withAll().load([props.task])

const lists = computed(
  () => listsRepo.all()
)

const allPres = computed(() => {
  console.debug('refreshing allPres value')
  return currentTask.value.hard_prereqs
})

const allPosts = computed(() => {
  console.debug('refreshing allPosts value')
  return currentTask.value.hard_postreqs
})

const allLists = listsRepo.all()
const listOptions = ref(allLists)

// thank you Berichtsheft for concise type info on this piece of quasar api
type voidFn = () => void
type doneFn = (a: voidFn) => void

const filterSelection = (val: string, update: doneFn) => {
  update(() => {
    if (val === '') {
      listOptions.value = allLists
    } else {
      const query = val.toLowerCase()
      listOptions.value = allLists.filter((x) => {
        return x.title.toLowerCase().includes(query)
      })
    }
  })
}

function getSelectedList(task: Task) {
  return (
    !!task.list ?
    { id: task.list.id, title: task.list.title } :
    null
  )
}

const selectedList = ref(getSelectedList(currentTask.value as Task))

function setCurrentTask(newTask: Task) {
  console.debug('setCurrentTask')
  if(newTask.id === null) {
    console.warn('setCurrentTask: new Task id was null')
    return
  }
  const repoTask = tr
      .with('hard_prereqs')
      .with('hard_postreqs')
      .find(newTask.id)
  currentTask.value = repoTask as Task
  editTitle.value = currentTask.value.title
  editNotes.value = currentTask.value.notes
  editRemindMeAt.value = currentTask.value.remind_me_at
  editMentalEnergyRequired.value = currentTask.value.mental_energy_required
  editPhysicalEnergyRequired.value = currentTask.value.physical_energy_required
  selectedList.value = getSelectedList(currentTask.value as Task)
}

function deleteTask(title: string, id: number) {
  if(id === null) {
    console.warn('deleteTask: id was null')
    return
  }
  $q.dialog({
    title: `Delete task: "${title}"`,
    message: 'This cannot be undone! Are you sure?',
    ok: {
      label: 'Delete',
      color: 'negative'
    },
    cancel: {
      color: 'grey'
    }
  }).onOk(
    () => {
      tr.delete(id).then(
        Utils.handleSuccess('Deleted task', 'fa-solid fa-tasks'),
        Utils.handleError('Failed to delete task.')
      )
    }
  )
}

async function updateTask(options: AllOptionalTaskProperties) {
  await tr.update({id: currentTask.value.id ?? -1, payload: { task: options } })
}

function openPrerequisiteDialog() {
  $q.dialog({
    component: TaskSearchDialog,

    componentProps: {
      dialogTitle: 'Add Prerequisite',
      task: currentTask.value,
      onSelect: async (payload: { task: Task }) => { 
        console.debug('task was selected. ', {payload})
        await addPrereq(payload.task) 
      },
    }
  })
}

const addPrereq = async (payload: Task) => {
  const t = currentTask.value
  const t_id = Utils.hardCheck(t.id, 'addPrereq: id of current task is null or undefined!')
  const payload_id = Utils.hardCheck(payload.id, 'addPrereq: id of prereq is null or undefined!')
  let updates: UpdateTaskOptions = { id: t_id, payload: { task: { hard_prereq_ids: [...t.hard_prereq_ids, payload_id] } } }
  await tr.update(updates).
  then(
    Utils.handleSuccess('Added Prerequisite', 'fa-solid fa-link'),
    // now comes the fun part though... the updateTaskDialog does 
    // not show the prerequisites updated with the new value, and 
    // the tasks page(s) do not update to show the new structure either.    
    Utils.handleError('Failed to add prereq')
  )
  refreshCurrentTask()
}

const removePrerequisite = (prereq: Task) => {
  Utils.notifySuccess(`removing pre ${prereq.title}`, 'fa-solid fa-unlink')
  const t = currentTask.value
  // const t_id = Utils.hardCheck(t.id, 'removePrerequisite: id of current task is null or undefined!')
  const prereq_id = Utils.hardCheck(prereq.id, 'removePrerequisite: id of prereq is null or undefined!')
  type temptask = { id: number, val?: Task | Item<Task> }
  const temp_prereqs_list = t.hard_prereq_ids.map((x) => ({id: x, val: undefined} as temptask))
  const new_prereqs_list = temp_prereqs_list.splice(t.hard_prereq_ids.indexOf(prereq.id!), 1)
  new_prereqs_list.forEach((x) => x.val = tr.find(x.id))
  Utils.notifySuccess(`removed pre from prereqs list, see console.`)
  console.debug(new_prereqs_list)
  // let updates: UpdateTaskOptions = { id: t_id, payload: { task: { hard_prereq_ids: t.hard_prereq_ids.splice(t.hard_prereq_ids.indexOf(prereq_id), 1) } } }
  // await tr.update(updates)
  // .then(
  //   Utils.handleSuccess('Removed Prerequisite', 'fa-solid fa-unlink'),
  //   Utils.handleError('Failed to remove prereq')
  // )
  // refreshCurrentTask()
}

// other methods that we used in our vue html template;
// these are part of our example (so not required)
const onOKClick = onDialogOK

// we can passthrough onDialogCancel directly
const onCancelClick = onDialogCancel
    
  

</script>
