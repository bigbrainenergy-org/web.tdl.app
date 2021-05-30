<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-datetime
      v-model="editDatetime"
      :label="label"
      :display-clear-button="true"
      @cancel="onCancelClick"
      @update:model-value="onSave"
    />
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
import QDatetime from 'components/QDatetime.vue';
import { ref } from 'vue'

export default {
  components: { QDatetime },
  props: {
    datetime: {
      type: String,
      default: () => ''
    },
    label: {
      type: String,
      default: () => ''
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

    const editDatetime = ref(props.datetime)

    function onSave(value) {
      onDialogOK({ datetime: value })
    }

    return {
      // Custom stuff
      onSave,
      editDatetime,

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
