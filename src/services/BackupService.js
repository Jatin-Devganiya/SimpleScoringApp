import { storageProvider } from '../storage/storageFactory';
import { DataMigrationService } from './DataMigrationService';

export class BackupService {
  constructor(provider = storageProvider) {
    this.provider = provider;
  }

  async exportBackup() {
    const rawData = await this.provider.exportData();
    const jsonString = JSON.stringify(rawData, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `cricket-score-backup-${dateStr}.json`;

    // Trigger browser file download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, fileName };
  }

  async importBackup(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new Error('This backup file is invalid (not valid JSON).');
    }

    const { isValid, error, normalized } = DataMigrationService.validateAndNormalize(parsed);
    if (!isValid) {
      throw new Error(error || 'This backup file is invalid.');
    }

    await this.provider.importData(normalized);
    return { success: true, count: normalized.matches.length };
  }

  async clearAllData() {
    return await this.provider.clearAllData();
  }
}

export const backupService = new BackupService();
