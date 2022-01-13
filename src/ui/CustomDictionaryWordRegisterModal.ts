import {
  App,
  ButtonComponent,
  DropdownComponent,
  Modal,
  TextAreaComponent,
  TextComponent,
} from "obsidian";
import { mirrorMap } from "../util/collection-helper";
import { Word } from "../provider/suggester";

export class CustomDictionaryWordRegisterModal extends Modal {
  currentDictionaryPath: string;
  value: string;
  description: string;
  aliases: string[];

  wordTextArea: TextAreaComponent;
  button: ButtonComponent;

  constructor(
    app: App,
    dictionaryPaths: string[],
    initialValue: string = "",
    onClickAdd: (dictionaryPath: string, word: Word) => void
  ) {
    super(app);
    this.currentDictionaryPath = dictionaryPaths[0];
    this.value = initialValue;

    this.titleEl.setText("Add a word to a custom dictionary");

    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h4", { text: "Dictionary" });
    new DropdownComponent(contentEl)
      .addOptions(mirrorMap(dictionaryPaths, (x) => x))
      .onChange((v) => {
        this.currentDictionaryPath = v;
      });

    contentEl.createEl("h4", { text: "Word" });
    this.wordTextArea = new TextAreaComponent(contentEl)
      .setValue(this.value)
      .onChange((v) => {
        this.value = v;
        this.button.setDisabled(!v);
        if (v) {
          this.button.setCta();
        } else {
          this.button.removeCta();
        }
      });
    this.wordTextArea.inputEl.setAttribute("style", "width: 400px");

    contentEl.createEl("h4", { text: "Description" });
    new TextComponent(contentEl)
      .onChange((v) => {
        this.description = v;
      })
      .inputEl.setAttribute("style", "width: 400px");

    contentEl.createEl("h4", { text: "Aliases (for each line)" });
    new TextAreaComponent(contentEl)
      .onChange((v) => {
        this.aliases = v.split("\n");
      })
      .inputEl.setAttribute("style", "width: 400px");

    this.button = new ButtonComponent(
      contentEl.createEl("div", {
        attr: {
          style: "display: flex; justify-content: center; margin-top: 15px",
        },
      })
    )
      .setButtonText("Add to dictionary")
      .setCta()
      .setDisabled(!this.value)
      .onClick(() => {
        onClickAdd(this.currentDictionaryPath, {
          value: this.value,
          description: this.description,
          aliases: this.aliases,
        });
      });
    if (this.value) {
      this.button.setCta();
    } else {
      this.button.removeCta();
    }
  }
}
