import { Modal } from "obsidian";

export class InputDialog extends Modal {
  inputEl!: HTMLInputElement;
  promise!: Promise<string | null>;
  submitted = false;

  constructor(
    public args: {
      title: string;
      placeholder?: string;
      defaultValue?: string;
    },
  ) {
    super(app);
  }

  onOpen(): void {
    this.titleEl.setText(this.args.title);

    this.inputEl = this.contentEl.createEl("input", {
      type: "text",
      placeholder: this.args.placeholder ?? "",
      cls: "carnelian-input-dialog-input",
      value: this.args.defaultValue,
    });
  }

  /**
   * This function returns
   *   - Promise<string> if submitted not empty string
   *   - Promise<""> if submitted empty string
   *   - Promise<null> if canceled
   */
  open(args?: { initialSelect: boolean }): Promise<string | null> {
    super.open();

    this.promise = new Promise<string | null>((resolve) => {
      const listener = (ev: KeyboardEvent) => {
        if (ev.isComposing) {
          return;
        }
        if (ev.code === "Enter") {
          ev.preventDefault();
          resolve(this.inputEl.value);
          this.submitted = true;
          this.close();
        }
      };

      this.inputEl.addEventListener("keydown", listener);

      this.onClose = () => {
        super.onClose();
        this.inputEl.removeEventListener("keydown", listener);
        if (!this.submitted) {
          resolve(null);
        }
      };

      if (args?.initialSelect) {
        this.inputEl.select();
      }
    });

    return this.promise;
  }
}
