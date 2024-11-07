import * as React from "react";
import { TFile, Notice } from "obsidian";
import FileOrganizer from "../../index";
import { ClassificationBox } from "./classification-box";
import { FabricClassificationBox } from "./fabric-classification-box";
import { DEFAULT_SETTINGS } from "../../settings";

interface ClassificationBoxProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}

export const ClassificationContainer: React.FC<ClassificationBoxProps> = ({
  plugin,
  file,
  content,
  refreshKey,
}) => {
  const [formatBehavior, setFormatBehavior] = React.useState<"override" | "newFile">(
    plugin.settings.formatBehavior || DEFAULT_SETTINGS.formatBehavior
  );
  const [backupFile, setBackupFile] = React.useState<string | null>(null);

  const handleFormat = async (templateName: string) => {
    if (!file) {
      console.error("No file selected");
      return;
    }
    try {
      const fileContent = await plugin.app.vault.read(file);
      if (typeof fileContent !== "string") {
        throw new Error("File content is not a string");
      }
      const formattingInstruction = await plugin.getTemplateInstructions(
        templateName
      );

      await plugin.formatContentInSplitView({
        file: file,
        content: fileContent,
        formattingInstruction: formattingInstruction,
      });

      console.log("Content formatted successfully");
    } catch (error) {
      console.error("Error in handleFormat:", error);
    }
  };

  const handleRevert = async () => {
    if (!file || !backupFile) return;

    try {
      const backupTFile = plugin.app.vault.getAbstractFileByPath(backupFile) as TFile;
      if (!backupTFile) {
        throw new Error("Backup file not found");
      }

      const backupContent = await plugin.app.vault.read(backupTFile);
      await plugin.app.vault.modify(file, backupContent);
      new Notice("Successfully reverted to backup version", 3000);
    } catch (error) {
      console.error("Error reverting to backup:", error);
    }
  };

  const extractBackupFile = React.useCallback((content: string) => {
    const match = content.match(/\[\[(.+?)\s*\|\s*Link to original file\]\]/);
    if (match) {
      setBackupFile(match[1]);
    } else {
      setBackupFile(null);
    }
  }, []);

  React.useEffect(() => {
    if (content) {
      extractBackupFile(content);
    }
  }, [content, extractBackupFile]);

  const handleFormatBehaviorChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newBehavior = event.target.value as "override" | "newFile";
    setFormatBehavior(newBehavior);
    plugin.settings.formatBehavior = newBehavior;
    await plugin.saveSettings();
  };

  return (
    <div className="bg-[--background-primary-alt] text-[--text-normal] p-4 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <div className="font-semibold">Classification</div>
        {backupFile && (
          <button
            onClick={handleRevert}
            className="px-3 py-1 text-sm rounded-md bg-[--background-modifier-error] text-[--text-on-accent] hover:opacity-90 transition-opacity"
          >
            Revert
          </button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <label htmlFor="formatBehavior" className="font-medium">Format Behavior:</label>
        <select
          id="formatBehavior"
          value={formatBehavior}
          onChange={handleFormatBehaviorChange}
          className="px-2 py-1 rounded-md border border-[--background-modifier-border]"
        >
          <option value="override">Override</option>
          <option value="newFile">New File</option>
        </select>
      </div>
      <ClassificationBox
        plugin={plugin}
        file={file}
        content={content}
        refreshKey={refreshKey}
        onFormat={handleFormat}
      />
      {plugin.settings.enableFabric && (
        <FabricClassificationBox
          plugin={plugin}
          file={file}
          content={content}
          refreshKey={refreshKey}
          onFormat={handleFormat}
        />
      )}
    </div>
  );
};
