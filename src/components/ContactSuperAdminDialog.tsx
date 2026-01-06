import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Send, Mail, Phone, User, ExternalLink } from 'lucide-react';

interface SuperAdminContact {
  id: number;
  name: string;
  email: string;
  whatsapp?: string;
  telegram?: string;
}

const ContactSuperAdminDialog = () => {
  const [open, setOpen] = useState(false);
  const [superAdmins, setSuperAdmins] = useState<SuperAdminContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchSuperAdmins();
    }
  }, [open]);

  const fetchSuperAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');

      const users = await response.json();

      // Filter only superadmins and sort by ID
      const admins = users
        .filter((u: any) => u.role === 'superadmin')
        .sort((a: any, b: any) => a.id - b.id)
        .slice(0, 2) // Max 2 superadmins
        .map((u: any) => ({
          id: u.id,
          name: u.name || 'Super Admin',
          email: u.email,
          whatsapp: u.whatsapp,
          telegram: u.telegram,
        }));

      setSuperAdmins(admins);
    } catch (error) {
      console.error('Error fetching superadmins:', error);
      setSuperAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (number: string) => {
    // Format: remove spaces, + signs, etc.
    const cleanNumber = number.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const openTelegram = (handle: string) => {
    // Support @username or t.me/username or just username
    let url = handle;
    if (handle.startsWith('@')) {
      url = `https://t.me/${handle.substring(1)}`;
    } else if (handle.startsWith('http')) {
      url = handle;
    } else if (!handle.startsWith('t.me/')) {
      url = `https://t.me/${handle}`;
    } else {
      url = `https://${handle}`;
    }
    window.open(url, '_blank');
  };

  const openEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const hasAnyContact = (admin: SuperAdminContact) => {
    return admin.whatsapp || admin.telegram || admin.email;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageCircle className="w-4 h-4" />
          Hubungi Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-orange-600" />
            Hubungi Admin
          </DialogTitle>
          <DialogDescription>
            Pilih metode untuk menghubungi tim Admin kami
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-3 text-gray-600">Memuat data...</span>
          </div>
        ) : superAdmins.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Phone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Belum ada kontak Super Admin yang tersedia</p>
          </div>
        ) : (
          <div className="space-y-4">
            {superAdmins.map((admin, index) => (
              <Card key={admin.id} className="border-orange-100">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <User className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-orange-600 text-base">
                        {admin.name}
                      </h3>
                      <p className="text-xs text-gray-500">Admin {index + 1}</p>
                    </div>
                  </div>

                  {hasAnyContact(admin) ? (
                    <div className="space-y-2">
                      {admin.whatsapp && (
                        <Button
                          onClick={() => openWhatsApp(admin.whatsapp!)}
                          variant="outline"
                          className="w-full justify-start gap-3 hover:bg-green-50 hover:border-green-300"
                        >
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          <span className="flex-1 text-left">WhatsApp</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </Button>
                      )}

                      {admin.telegram && (
                        <Button
                          onClick={() => openTelegram(admin.telegram!)}
                          variant="outline"
                          className="w-full justify-start gap-3 hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Send className="w-4 h-4 text-blue-600" />
                          <span className="flex-1 text-left">Telegram</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </Button>
                      )}

                      {admin.email && (
                        <Button
                          onClick={() => openEmail(admin.email)}
                          variant="outline"
                          className="w-full justify-start gap-3 hover:bg-orange-50 hover:border-orange-300"
                        >
                          <Mail className="w-4 h-4 text-orange-600" />
                          <span className="flex-1 text-left">Email</span>
                          <span className="text-xs text-gray-500 truncate max-w-[200px]">
                            {admin.email}
                          </span>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-2">
                      Kontak belum diatur
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-800">
            <strong>Tips:</strong> Untuk respons lebih cepat, gunakan WhatsApp atau Telegram.
            Untuk pertanyaan formal, gunakan Email.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactSuperAdminDialog;
