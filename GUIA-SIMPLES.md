import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, ShieldCheck, Package, Search, MapPin, Power, Trash2,
  FileSpreadsheet, Users as UsersIcon, Store, Download, Filter, X,
  TrendingUp, CheckCircle2, XCircle, User as UserIcon, AlertTriangle, FileText, Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Admin, Distributor, User } from '../../types';

import ImportModal from './ImportModal';

interface AdminDashboardProps {
  admin: Admin | null;
  distributors: Distributor[];
  users: User[];
  onToggleStatus: (id: string) => void;
  onRemoveDistributor: (id: string) => void;
  onRemoveUser: (userId: string) => void;
  onImport: (items: Array<Omit<Distributor, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  onLogout: () => void;
}

type Tab = 'distributors' | 'users';

export default function AdminDashboard({
  admin,
  distributors,
  users,
  onToggleStatus,
  onRemoveDistributor,
  onRemoveUser,
  onImport,
  onLogout,
}: AdminDashboardProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [tab, setTab] = useState<Tab>('distributors');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'distributor' | 'user'; id: string } | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success'>('idle');
  const [observationModal, setObservationModal] = useState<Distributor | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Enriquecer distribuidoras com info do usuário
  const enrichedDistributors = useMemo(() => {
    const userMap = new Map(users.map((u) => [u.id, u]));
    return distributors.map((d) => {
      const u = userMap.get(d.userId);
      return {
        ...d,
        userName: u?.name || 'Usuário removido',
        userEmail: u?.email || '-',
      };
    });
  }, [distributors, users]);

  const filteredDistributors = enrichedDistributors.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.address.toLowerCase().includes(q) ||
      d.userName.toLowerCase().includes(q) ||
      d.userEmail.toLowerCase().includes(q);
    const matchesFilter = filter === 'all' ? true : filter === 'open' ? d.isOpen : !d.isOpen;
    return matchesSearch && matchesFilter;
  });

  const filteredUsers = users.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = useMemo(() => {
    const openCount = distributors.filter((d) => d.isOpen).length;
    return {
      total: distributors.length,
      open: openCount,
      closed: distributors.length - openCount,
      users: users.length,
    };
  }, [distributors, users]);

  const exportToExcel = () => {
    // Planilha 1: Distribuidoras
    const distributorsData = enrichedDistributors.map((d) => ({
      'ID': d.id,
      'Nome da Distribuidora': d.name,
      'Endereço': d.address,
      'Localização (Coordenadas)': d.location || '',
      'Observação': d.observation || '',
      'Status': d.isOpen ? 'Aberta' : 'Fechada',
      'Tem Foto': d.photo ? 'Sim' : 'Não',
      'Usuário (Nome)': d.userName,
      'Usuário (E-mail)': d.userEmail,
      'Data de Cadastro': new Date(d.createdAt).toLocaleString('pt-BR'),
      'Última Atualização': new Date(d.updatedAt).toLocaleString('pt-BR'),
    }));

    // Planilha 2: Usuários
    const usersData = users.map((u) => ({
      'ID': u.id,
      'Nome': u.name,
      'E-mail': u.email,
      'Total de Distribuidoras': distributors.filter((d) => d.userId === u.id).length,
      'Data de Cadastro': new Date(u.createdAt).toLocaleString('pt-BR'),
    }));

    // Planilha 3: Resumo Estatístico
    const summaryData = [
      { 'Métrica': 'Total de Distribuidoras', 'Valor': stats.total },
      { 'Métrica': 'Distribuidoras Abertas', 'Valor': stats.open },
      { 'Métrica': 'Distribuidoras Fechadas', 'Valor': stats.closed },
      { 'Métrica': 'Total de Usuários', 'Valor': stats.users },
      { 'Métrica': 'Média de Distribuidoras por Usuário', 'Valor': stats.users ? (stats.total / stats.users).toFixed(2) : '0' },
      { 'Métrica': 'Data da Exportação', 'Valor': new Date().toLocaleString('pt-BR') },
      { 'Métrica': 'Exportado por', 'Valor': admin?.email || '-' },
    ];

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(distributorsData);
    const ws2 = XLSX.utils.json_to_sheet(usersData);
    const ws3 = XLSX.utils.json_to_sheet(summaryData);

    // Ajustar largura das colunas
    ws1['!cols'] = [{ wch: 18 }, { wch: 28 }, { wch: 40 }, { wch: 28 }, { wch: 50 }, { wch: 12 }, { wch: 10 }, { wch: 22 }, { wch: 28 }, { wch: 20 }, { wch: 20 }];
    ws2['!cols'] = [{ wch: 18 }, { wch: 30 }, { wch: 30 }, { wch: 22 }, { wch: 22 }];
    ws3['!cols'] = [{ wch: 35 }, { wch: 25 }];

    XLSX.utils.book_append_sheet(wb, ws1, 'Distribuidoras');
    XLSX.utils.book_append_sheet(wb, ws2, 'Usuários');
    XLSX.utils.book_append_sheet(wb, ws3, 'Resumo');

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `distribuidoras_relatorio_${date}.xlsx`);

    setExportStatus('success');
    setTimeout(() => setExportStatus('idle'), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800 leading-tight">Painel Admin</div>
                <div className="text-xs text-slate-500 leading-tight">Sistema de Distribuidoras</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-indigo-700 font-medium">{admin?.name}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
                <p className="text-xs text-slate-400 mt-1">distribuidoras</p>
              </div>
              <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Abertas</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.open}</p>
                <p className="text-xs text-slate-400 mt-1">em operação</p>
              </div>
              <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Fechadas</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.closed}</p>
                <p className="text-xs text-slate-400 mt-1">inativas</p>
              </div>
              <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Usuários</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.users}</p>
                <p className="text-xs text-slate-400 mt-1">cadastrados</p>
              </div>
              <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setTab('distributors')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === 'distributors'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-4 h-4" />
                Distribuidoras
              </button>
              <button
                onClick={() => setTab('users')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === 'users'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                Usuários
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  tab === 'distributors'
                    ? 'Buscar por nome, endereço ou usuário...'
                    : 'Buscar por nome ou e-mail...'
                }
                className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter e Export (só para distribuidoras) */}
            {tab === 'distributors' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Filter className="w-4 h-4 text-slate-400" />
                  {(['all', 'open', 'closed'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filter === f
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {f === 'all' ? 'Todas' : f === 'open' ? 'Abertas' : 'Fechadas'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setImportModalOpen(true)}
                  className="relative inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  title="Ação exclusiva de administrador — Importar distribuidoras de um arquivo Excel/CSV"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Importar</span>
                  <span className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-semibold uppercase tracking-wide">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Admin
                  </span>
                </button>
                <button
                  onClick={exportToExcel}
                  className="relative inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  title="Ação exclusiva de administrador — Exportar todas as distribuidoras para Excel"
                >
                  {exportStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Exportado!
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="hidden sm:inline">Exportar Excel</span>
                      <span className="sm:hidden">Excel</span>
                      <span className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-semibold uppercase tracking-wide">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Admin
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo das abas */}
        <AnimatePresence mode="wait">
          {tab === 'distributors' ? (
            <motion.div
              key="distributors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {filteredDistributors.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-700">
                    {distributors.length === 0 ? 'Nenhuma distribuidora cadastrada' : 'Nenhum resultado encontrado'}
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">
                    {distributors.length === 0
                      ? 'Ainda não há distribuidoras cadastradas por nenhum usuário.'
                      : 'Tente ajustar os filtros de busca.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Foto</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Distribuidora</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Endereço</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Usuário</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden xl:table-cell">Observação</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDistributors.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            {d.photo ? (
                              <img
                                src={d.photo}
                                alt={d.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Package className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800 truncate max-w-[200px]">{d.name}</div>
                            <div className="text-xs text-slate-400 md:hidden truncate max-w-[200px]">
                              {d.address}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="flex items-start gap-1.5 text-slate-600 max-w-[260px]">
                              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                              <span className="line-clamp-2 text-xs">{d.address}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div>
                              <div className="text-slate-700 truncate max-w-[180px]">{d.userName}</div>
                              <div className="text-xs text-slate-400 truncate max-w-[180px]">{d.userEmail}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell">
                            {d.observation ? (
                              <button
                                onClick={() => setObservationModal(d)}
                                className="flex items-start gap-1.5 px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md text-xs text-amber-800 transition-colors text-left max-w-[220px]"
                                title="Clique para ver observação completa"
                              >
                                <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                                <span className="line-clamp-2">{d.observation}</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-300 italic">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => onToggleStatus(d.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                                d.isOpen
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                              title="Clique para alternar status"
                            >
                              <Power className="w-3 h-3" />
                              {d.isOpen ? 'Aberta' : 'Fechada'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setDeleteConfirm({ type: 'distributor', id: d.id })}
                              className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {filteredUsers.length === 0 ? (
                <div className="text-center py-16">
                  <UserIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-700">
                    {users.length === 0 ? 'Nenhum usuário cadastrado' : 'Nenhum resultado encontrado'}
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">
                    {users.length === 0
                      ? 'Ainda não há usuários cadastrados no sistema.'
                      : 'Tente ajustar a busca.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Usuário</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">E-mail</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Distribuidoras</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Cadastro</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => {
                        const userDistCount = distributors.filter((d) => d.userId === u.id).length;
                        return (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <UserIcon className="w-4 h-4 text-indigo-600" />
                                </div>
                                <span className="font-medium text-slate-800">{u.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full text-xs font-medium text-slate-700">
                                <Package className="w-3 h-3" />
                                {userDistCount}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">
                              {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setDeleteConfirm({ type: 'user', id: u.id })}
                                className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir usuário e suas distribuidoras"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rodapé com info */}
        <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Sistema gerenciado por {admin?.name} ({admin?.email})
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Exportação inclui todas as abas: Distribuidoras, Usuários e Resumo
          </div>
        </div>
      </main>

      {/* Modal de confirmação */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Confirmar exclusão</h3>
              </div>
              <p className="text-slate-500 text-sm">
                {deleteConfirm.type === 'distributor'
                  ? 'Tem certeza que deseja excluir esta distribuidora? Esta ação não pode ser desfeita.'
                  : 'Tem certeza que deseja excluir este usuário? Todas as distribuidoras vinculadas a ele também serão removidas.'}
              </p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirm.type === 'distributor') {
                      onRemoveDistributor(deleteConfirm.id);
                    } else {
                      onRemoveUser(deleteConfirm.id);
                    }
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {observationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setObservationModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-800">Observação</h3>
                  <p className="text-sm text-slate-500 truncate">{observationModal.name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    Usuário: {observationModal.userName}
                  </p>
                </div>
                <button
                  onClick={() => setObservationModal(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {observationModal.observation}
                </p>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setObservationModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImportModal
        isOpen={importModalOpen}
        users={users}
        onClose={() => setImportModalOpen(false)}
        onImport={onImport}
      />
    </div>
  );
}
