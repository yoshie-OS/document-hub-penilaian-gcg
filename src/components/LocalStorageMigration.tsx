/**
 * LocalStorage to SQLite Migration Utility
 *
 * This component helps users migrate their existing localStorage data to SQLite database.
 * It should be run once during the upgrade process.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

interface MigrationStatus {
  checklist: number;
  assignments: number;
  documents: number;
  assessments: number;
  direktorat: number;
  subdirektorat: number;
  anak_perusahaan: number;
  users: number;
}

export const LocalStorageMigration: React.FC = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const collectLocalStorageData = () => {
    const data: Record<string, any> = {};

    // Collect all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            data[key] = JSON.parse(value);
          }
        } catch (e) {
          console.error(`Failed to parse localStorage key: ${key}`, e);
        }
      }
    }

    return data;
  };

  const handleMigration = async () => {
    setIsMigrating(true);
    setErrors([]);
    setMigrationStatus(null);

    try {
      // Collect all localStorage data
      const localStorageData = collectLocalStorageData();

      console.log('Collected localStorage data:', Object.keys(localStorageData));

      // Send to backend migration endpoint
      const response = await fetch(`${API_BASE_URL}/migrate-localstorage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(localStorageData),
      });

      if (response.ok) {
        const result = await response.json();
        setMigrationStatus(result.migrated);
        if (result.errors && result.errors.length > 0) {
          setErrors(result.errors);
        }
        setMigrationComplete(true);
      } else {
        const errorText = await response.text();
        setErrors([`Migration failed: ${errorText}`]);
      }
    } catch (error) {
      setErrors([`Migration error: ${error instanceof Error ? error.message : String(error)}`]);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClearLocalStorage = () => {
    if (confirm('Are you sure you want to clear all localStorage? This action cannot be undone. Make sure migration was successful first!')) {
      // Keep only auth token
      const authToken = localStorage.getItem('authToken');
      localStorage.clear();
      if (authToken) {
        localStorage.setItem('authToken', authToken);
      }
      alert('localStorage cleared! (Auth token preserved)');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          LocalStorage to SQLite Migration
        </CardTitle>
        <CardDescription>
          Migrate your existing localStorage data to the new SQLite database backend
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!migrationComplete && (
          <Alert>
            <AlertDescription>
              This migration will copy all your localStorage data to the SQLite database.
              Your localStorage data will remain intact until you manually clear it after
              verifying the migration was successful.
            </AlertDescription>
          </Alert>
        )}

        {errors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Migration Errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {migrationStatus && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="font-semibold mb-2 text-green-600">Migration Complete!</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>✓ Checklist items: {migrationStatus.checklist}</div>
                <div>✓ Assignments: {migrationStatus.assignments}</div>
                <div>✓ Documents: {migrationStatus.documents}</div>
                <div>✓ Assessments: {migrationStatus.assessments}</div>
                <div>✓ Direktorat: {migrationStatus.direktorat}</div>
                <div>✓ Subdirektorat: {migrationStatus.subdirektorat}</div>
                <div>✓ Anak Perusahaan: {migrationStatus.anak_perusahaan}</div>
                <div>✓ Users: {migrationStatus.users}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleMigration}
            disabled={isMigrating || migrationComplete}
            className="flex-1"
          >
            {isMigrating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Migrating...
              </>
            ) : migrationComplete ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Migration Complete
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Start Migration
              </>
            )}
          </Button>

          {migrationComplete && (
            <Button
              onClick={handleClearLocalStorage}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Clear localStorage
            </Button>
          )}
        </div>

        {migrationComplete && (
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Next steps:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Verify your data is correctly migrated by checking your pages</li>
                <li>Once verified, click "Clear localStorage" to free up browser storage</li>
                <li>The application now uses SQLite for all data storage</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default LocalStorageMigration;
