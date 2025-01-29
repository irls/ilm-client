<script>
  import Dropdown from "primevue/dropdown";
  import { cleanFilter } from "../../../filters/search";
  export default {
    extends: Dropdown,
    setup: Dropdown.setup,
    computed: {
      visibleOptions: {
        get() {
          if (this.filterValue) {
            let cleanValue = cleanFilter(this.filterValue);
            if (cleanValue && cleanValue.trim().length > 0) {
              return this.options.filter(option => {
                let cleanOption = this.getOptionLabel(option);
                return cleanOption.toLocaleLowerCase(this.filterLocale).indexOf(cleanValue.toLocaleLowerCase(this.filterLocale)) > -1;
              });
            }
          }
          return this.options;
        }, 
        cache: false
      }
    }
  }
</script>