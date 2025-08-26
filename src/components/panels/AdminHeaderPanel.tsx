import React from 'react';

interface AdminHeaderPanelProps {
  userName: string;
  userSubdirektorat: string;
}

const AdminHeaderPanel: React.FC<AdminHeaderPanelProps> = ({
  userName,
  userSubdirektorat
}) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
      <p className="text-gray-600 mt-2">
        Selamat datang, {userName} - {userSubdirektorat}
      </p>
    </div>
  );
};

export default AdminHeaderPanel;
