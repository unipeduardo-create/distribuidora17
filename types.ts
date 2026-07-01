import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Camera, MapPin, Store, Power,
  Check, X, Upload, ImagePlus, FileText
} from 'lucide-react';
import type { Distributor } from '../types';

interface DistributorFormProps {
  getById: (id: string) => Distributor | undefined;
  onAdd: (distributor: Omit<Distributor, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { userName?: string; userEmail?: string }) => Distributor;
  onUpdate: (id: string, data: Partial<Distributor>) => void;
}

export default function DistributorForm({ getById, onAdd, onUpdate }: DistributorFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('');
  const [observation, setObservation] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing && id) {
      const d = getById(id);
      if (d) {
        setName(d.name);
        setAddress(d.address);
        setLocation(d.location);
        setObservation(d.observation || '');
        setPhoto(d.photo);
        setIsOpen(d.isOpen);
      } else {
        navigate('/');
      }
    }
  }, [isEditing, id, getById, navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'A imagem deve ter no máximo 5MB.' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
      setErrors((prev) => {
        const { photo, ...rest } = prev;
        return rest;
      });
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'O nome é obrigatório.';
    if (!address.trim()) newErrors.address = 'O endereço é obrigatório.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      if (isEditing && id) {
        onUpdate(id, { name, address, location, photo, isOpen, observation });
      } else {
        onAdd({ name, address, location, photo, isOpen, observation });
      }
      setIsSubmitting(false);
      navigate('/');
    }, 400);
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, location: 'Geolocalização não suportada pelo navegador.' }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        setLocation(coords);
        setErrors((prev) => {
          const { location, ...rest } = prev;
          return rest;
        });
      },
      () => {
        setErrors((prev) => ({ ...prev, location: 'Não foi possível obter a localização.' }));
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
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
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              {isEditing ? 'Editar Distribuidora' : 'Nova Distribuidora'}
            </h1>
            <p className="text-sm text-slate-500">
              {isEditing ? 'Atualize os dados da distribuidora.' : 'Preencha os dados para cadastrar uma nova distribuidora.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Foto da distribuidora
            </label>
            <div className="flex items-start gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 flex items-center justify-center cursor-pointer transition-colors overflow-hidden group"
              >
                {photo ? (
                  <>
                    <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <ImagePlus className="w-8 h-8 text-slate-400 mx-auto" />
                    <span className="text-xs text-slate-400 mt-1 block">Adicionar foto</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {photo ? 'Trocar foto' : 'Selecionar foto'}
                </button>
                {photo && (
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors ml-2"
                  >
                    <X className="w-4 h-4" />
                    Remover
                  </button>
                )}
                <p className="text-xs text-slate-400">Formatos: JPG, PNG. Máximo 5MB.</p>
                {errors.photo && <p className="text-xs text-red-500">{errors.photo}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nome da distribuidora <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                  errors.name ? 'border-red-300' : 'border-slate-200'
                }`}
                placeholder="Ex: Distribuidora Central"
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Endereço <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none ${
                  errors.address ? 'border-red-300' : 'border-slate-200'
                }`}
                placeholder="Rua, número, bairro, cidade, estado, CEP"
              />
            </div>
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Localização (coordenadas)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.location ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder="Latitude, Longitude"
                />
              </div>
              <button
                type="button"
                onClick={getLocation}
                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shrink-0"
              >
                <MapPin className="w-4 h-4" />
                Usar GPS
              </button>
            </div>
            {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Observações
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                rows={4}
                maxLength={1000}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                placeholder="Adicione informações adicionais sobre a distribuidora (ex: horário de funcionamento, contatos, produtos oferecidos, etc.)"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1 text-right">
              {observation.length}/1000 caracteres
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status inicial</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  isOpen
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <Power className="w-4 h-4" />
                <span className="text-sm font-medium">Aberta</span>
                {isOpen && <Check className="w-4 h-4 ml-1" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  !isOpen
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <Power className="w-4 h-4" />
                <span className="text-sm font-medium">Fechada</span>
                {!isOpen && <Check className="w-4 h-4 ml-1" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {isEditing ? 'Salvar alterações' : 'Cadastrar'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
