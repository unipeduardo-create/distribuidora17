import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Power, Edit3, Calendar, ImageOff, FileText } from 'lucide-react';
import type { Distributor } from '../types';

interface DistributorDetailProps {
  getById: (id: string) => Distributor | undefined;
}

export default function DistributorDetail({ getById }: DistributorDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const distributor = id ? getById(id) : undefined;

  useEffect(() => {
    if (!distributor) {
      navigate('/');
    }
  }, [distributor, navigate]);

  if (!distributor) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para lista
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="relative h-64 bg-slate-100">
          {distributor.photo ? (
            <img
              src={distributor.photo}
              alt={distributor.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="w-16 h-16 text-slate-300" />
            </div>
          )}
          <div className="absolute top-4 right-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
                distributor.isOpen
                  ? 'bg-emerald-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {distributor.isOpen ? 'Aberta' : 'Fechada'}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{distributor.name}</h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <MapPin className="w-4 h-4" />
                Endereço
              </div>
              <p className="text-slate-800 font-medium">{distributor.address}</p>
            </div>

            {distributor.location && (
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <MapPin className="w-4 h-4" />
                  Coordenadas
                </div>
                <p className="text-slate-800 font-medium font-mono text-sm">{distributor.location}</p>
              </div>
            )}
          </div>

          {distributor.observation && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-amber-700 font-medium mb-2">
                <FileText className="w-4 h-4" />
                Observação
              </div>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {distributor.observation}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Calendar className="w-4 h-4" />
                Cadastrado em
              </div>
              <p className="text-slate-800 font-medium text-sm">{formatDate(distributor.createdAt)}</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Calendar className="w-4 h-4" />
                Última atualização
              </div>
              <p className="text-slate-800 font-medium text-sm">{formatDate(distributor.updatedAt)}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              to={`/editar/${distributor.id}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Editar distribuidora
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
