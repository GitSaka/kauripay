"use client";

import { useState, useRef } from "react";
import { CheckCircle2, Building2, FileText, Truck, Camera, X, Loader2 } from "lucide-react";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { Dispatch, SetStateAction } from "react";

interface SellerShipmentCardProps {
  busDetails: string;
  setBusDetails: (value: string) => void;
  trackingNum: string;
  setTrackingNum: (value: string) => void;
  driverDetails: string; // Devient obligatoire et typé proprement
  setDriverDetails: (value: string) => void;
  images: string[]; // Reçoit le tableau d'images Cloudinary de la page principale
  setImages: Dispatch<SetStateAction<string[]>>;
  isActionLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SellerShipmentCard({
  busDetails,
  setBusDetails,
  trackingNum,
  setTrackingNum,
  driverDetails,
  setDriverDetails,
  images,
  setImages,
  isActionLoading,
  onSubmit,
}: SellerShipmentCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // 📸 Déclenche magiquement l'appareil photo natif du smartphone
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Appel de ta fonction utilitaire connectée au preset "WhatsUpload"
      const res = await uploadToCloudinary(file);
      if (res && res.url) {
        // 🔒 SÉCURISATION FONCTIONNELLE : "prev" contient le tableau réel mis à jour en direct au millième de seconde
        setImages((prev: string[]) => [...prev, res.url]); 
      }

    } catch (err) {
      console.error("Erreur téléversement Cloudinary :", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset du bouton
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4 w-full">
      
      {/* BANDEAU SÉQUESTRE RE-SÉCURISÉ */}
      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] font-bold text-emerald-800 flex gap-1.5 leading-relaxed">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>L acheteur a payé. Déposez le colis à la gare de bus et complétez ce bordereau de preuves immuables.</span>
      </div>

      {/* 🗂️ CHAMPS DE SAISIE LOGISTIQUE STYLE FINTECH PREMIUM */}
      <div className="space-y-4 text-left w-full">
        
        {/* 1. Compagnie de bus (Obligatoire) */}
        <div className="space-y-1 w-full">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
            1. Compagnie de Transport *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              required 
              value={busDetails} 
              onChange={(e) => setBusDetails(e.target.value)} 
              placeholder="Nom de la compagnie (ex: Baobab Express)" 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#4EBA93] text-slate-800 focus:border-transparent transition-all placeholder:text-slate-300" 
            />
          </div>
        </div>

        {/* 2. Numéro de reçu (Obligatoire) */}
        <div className="space-y-1 w-full">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
            2. Numéro de Bordereau / Reçu *
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              required 
              value={trackingNum} 
              onChange={(e) => setTrackingNum(e.target.value)} 
              placeholder="Numéro inscrit sur le ticket papier" 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#4EBA93] text-slate-800 focus:border-transparent transition-all placeholder:text-slate-300" 
            />
          </div>
        </div>

        {/* 3. Chauffeur et Plaque d'immatriculation (Devient Obligatoire pour le bouclier) */}
        <div className="space-y-1 w-full">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
            3. Véhicule et Contact Chauffeur *
          </label>
          <div className="relative">
            <Truck className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              required
              value={driverDetails} 
              onChange={(e) => setDriverDetails(e.target.value)} 
              placeholder="N° de plaque ou téléphone du conducteur" 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#4EBA93] text-slate-800 focus:border-transparent transition-all placeholder:text-slate-300" 
            />
          </div>
        </div>

        {/* 4. 📸 LA GRILLE DES MULTIPLES PREUVES PHOTO (3 MIN - 5 MAX) */}
        <div className="space-y-2 w-full pt-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider flex justify-between items-center">
            <span>4. Photos de Preuves Immuables ({images.length}/5)</span>
            <span className="text-[9px] font-bold text-slate-400">Min: 3 • Max: 5</span>
          </label>

          {/* Input invisible configuré pour forcer l'appareil photo arrière du smartphone */}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />

          {/* Grille d'affichage des images scellées sur Cloudinary */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 w-full animate-fade-in pb-1">
              {images.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-2xs">
                  <img src={url} alt={`Preuve Kauri ${index + 1}`} className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(index)} 
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full shadow-md active:scale-90 transition-transform cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-slate-950/70 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">Photo {index + 1}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bouton adaptatif intelligent style appareil photo */}
          {images.length < 5 && (
            <button
              type="button"
              disabled={isUploading}
              onClick={handleCameraClick}
              className="w-full border border-dashed border-slate-200 hover:border-[#4EBA93] text-slate-400 hover:text-[#4EBA93] p-4 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-extrabold bg-slate-50/50 cursor-pointer outline-none transition-all active:scale-[0.99]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#4EBA93]" />
                  <span className="text-[10px] text-slate-400 font-bold mt-1">Sécurisation du cliché sur Cloudinary...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 text-slate-400" />
                  <span>
                    {images.length === 0 
                      ? "Prendre la Photo n°1 (Le Colis ouvert)*" 
                      : images.length === 1 
                      ? "Prendre la Photo n°2 (Le Ticket de bus papier)*" 
                      : images.length === 2 
                      ? "Prendre la Photo n°3 (La Plaque ou Bagage)*" 
                      : `Prendre la Photo n°${images.length + 1} (Optionnelle)`
                    }
                  </span>
                </>
              )}
            </button>
          )}
        </div>

      </div>

      {/* BOUTON DE VALIDATION VERROUILLÉ TANT QUE LE DOSSIER EST INCOMPLET */}
      <button 
        type="submit" 
        disabled={isActionLoading || isUploading || !busDetails || !trackingNum || !driverDetails || images.length < 3} 
        className="w-full bg-[#0A2E1A] hover:bg-[#123D25] text-white font-extrabold py-3.5 rounded-xl text-sm transition-all active:scale-[0.99] shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
      >
        {images.length < 3 
          ? `Preuves insuffisantes : Prenez ${3 - images.length} photo(s) de plus` 
          : isActionLoading ? "Scellage du protocole..." : "Confirmer l'expédition & Bloquer le dossier"
        }
      </button>

    </form>
  );
}
