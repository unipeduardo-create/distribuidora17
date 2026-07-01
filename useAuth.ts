import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useDistributors } from './hooks/useDistributors';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useAdminData } from './hooks/useAdminData';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DistributorForm from './pages/DistributorForm';
import DistributorDetail from './pages/DistributorDetail';
import AdminLogin from './pages/admin/AdminLogin';
import AdminRegister from './pages/admin/AdminRegister';
import AdminDashboard from './pages/admin/AdminDashboard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { currentAdmin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PublicAdminRoute({ children }: { children: React.ReactNode }) {
  const { currentAdmin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (currentAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { currentUser, register, login, logout } = useAuth();
  const { distributors, add, update, remove, toggleStatus, getById } = useDistributors(currentUser?.id);

  const {
    currentAdmin,
    register: adminRegister,
    login: adminLogin,
    logout: adminLogout,
  } = useAdminAuth();

  const {
    distributors: allDistributors,
    users,
    toggleStatus: adminToggleStatus,
    remove: adminRemove,
    removeUser,
    importMany: adminImportMany,
  } = useAdminData();

  return (
    <Routes>
      {/* Rotas públicas do usuário */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login onLogin={login} />
          </PublicRoute>
        }
      />
      <Route
        path="/cadastro"
        element={
          <PublicRoute>
            <Register onRegister={register} />
          </PublicRoute>
        }
      />

      {/* Rotas protegidas do usuário */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout user={currentUser} onLogout={logout} />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Dashboard
              distributors={distributors}
              onToggleStatus={toggleStatus}
              onDelete={remove}
            />
          }
        />
        <Route
          path="nova"
          element={
            <DistributorForm
              getById={getById}
              onAdd={(d) =>
                add({
                  ...d,
                  userName: currentUser?.name,
                  userEmail: currentUser?.email,
                })
              }
              onUpdate={update}
            />
          }
        />
        <Route
          path="editar/:id"
          element={
            <DistributorForm
              getById={getById}
              onAdd={(d) =>
                add({
                  ...d,
                  userName: currentUser?.name,
                  userEmail: currentUser?.email,
                })
              }
              onUpdate={update}
            />
          }
        />
        <Route
          path="detalhes/:id"
          element={
            <DistributorDetail
              getById={getById}
            />
          }
        />
      </Route>

      {/* Rotas públicas do administrador */}
      <Route
        path="/admin/login"
        element={
          <PublicAdminRoute>
            <AdminLogin onLogin={adminLogin} />
          </PublicAdminRoute>
        }
      />
      <Route
        path="/admin/cadastro"
        element={
          <PublicAdminRoute>
            <AdminRegister onRegister={adminRegister} />
          </PublicAdminRoute>
        }
      />

      {/* Rotas protegidas do administrador */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard
              admin={currentAdmin}
              distributors={allDistributors}
              users={users}
              onToggleStatus={adminToggleStatus}
              onRemoveDistributor={adminRemove}
              onRemoveUser={removeUser}
              onImport={adminImportMany}
              onLogout={adminLogout}
            />
          </ProtectedAdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
