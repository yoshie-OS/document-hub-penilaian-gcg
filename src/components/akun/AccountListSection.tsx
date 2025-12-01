import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Edit, Trash2 } from 'lucide-react';

interface Account {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'superadmin';
  direktorat?: string;
  subdirektorat?: string;
  divisi?: string;
  createdAt: Date;
  isActive: boolean;
}

interface AccountListSectionProps {
  accounts: Account[];
  currentUserId?: number;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (account: Account) => void;
}

const AccountListSection: React.FC<AccountListSectionProps> = ({
  accounts,
  currentUserId,
  onEditAccount,
  onDeleteAccount
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Admin</Badge>;
      case 'user':
        return <Badge className="bg-green-100 text-green-800 border-green-200">User</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div id="accounts-list">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Daftar Akun</span>
          </CardTitle>
          <CardDescription>
            {accounts.length} akun ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Direktorat</TableHead>
                <TableHead>Subdirektorat</TableHead>
                <TableHead>Divisi</TableHead>
                <TableHead>Tanggal Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.email}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{getRoleBadge(account.role)}</TableCell>
                  <TableCell>{account.direktorat || '-'}</TableCell>
                  <TableCell>{account.subdirektorat || '-'}</TableCell>
                  <TableCell>{account.divisi || '-'}</TableCell>
                  <TableCell>{account.createdAt.toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditAccount(account)}
                        disabled={account.role === 'superadmin'}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onDeleteAccount(account)}
                        disabled={account.role === 'superadmin' || account.id === currentUserId}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada akun</h3>
          <p className="text-gray-500">
            Mulai dengan menambahkan akun pertama ke sistem
          </p>
        </div>
      )}
    </div>
  );
};

export default AccountListSection;
