import React, { useState, useEffect } from 'react';
import { CompanyInfo } from '../types';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import Button from '../components/common/Button';
import BuildingOfficeIcon from '../components/icons/BuildingOfficeIcon';

const CompanySettingsPage: React.FC = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    logoUrlDarkBg: '',
    logoUrlLightBg: '',
    address: '',
    phone: '',
    email: '',
    cnpj: '',
    instagram: '',
    website: '',
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const storedInfo = localStorage.getItem('companyInfo');
    if (storedInfo) {
      const parsedInfo = JSON.parse(storedInfo);
      // Ensure new fields are initialized if loading old data
      setCompanyInfo({
        ...{
          name: '',
          logoUrlDarkBg: '',
          logoUrlLightBg: '',
          address: '',
          phone: '',
          email: '',
          cnpj: '',
          instagram: '',
          website: '',
        },
        ...parsedInfo
      });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCompanyInfo({ ...companyInfo, [e.target.name]: e.target.value });
    setIsSaved(false);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>, logoType: 'dark' | 'light') => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const fieldName = logoType === 'dark' ? 'logoUrlDarkBg' : 'logoUrlLightBg';
        setCompanyInfo({ ...companyInfo, [fieldName]: reader.result as string });
        setIsSaved(false);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000); // Hide message after 3 seconds
  };

  return (
    <div className="p-6 bg-[#1d1d1d] shadow-xl rounded-lg text-white">
      <div className="flex items-center mb-6">
        <BuildingOfficeIcon className="h-8 w-8 text-yellow-500 mr-3" />
        <h2 className="text-2xl font-semibold text-white">Informações da Empresa</h2>
      </div>

      {isSaved && (
        <div className="mb-4 p-3 bg-green-600 border border-green-700 text-white rounded-md">
          Informações salvas com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nome da Empresa"
          id="name"
          name="name"
          type="text"
          value={companyInfo.name}
          onChange={handleChange}
          required
        />
        
        <div className="space-y-6">
          <div>
            <label htmlFor="logoUrlDarkBg" className="block text-sm font-medium text-gray-200 mb-1">Logo para Fundo Escuro (Topo do Site)</label>
            {companyInfo.logoUrlDarkBg && (
              <img src={companyInfo.logoUrlDarkBg} alt="Logo Dark Preview" className="h-20 mb-2 border border-[#282828] rounded p-1 bg-black"/>
            )}
            <Input
              id="logoUrlDarkBg"
              name="logoUrlDarkBg"
              type="file"
              accept="image/*"
              onChange={(e) => handleLogoChange(e, 'dark')}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600"
            />
             <p className="mt-1 text-xs text-gray-400">Ideal para o cabeçalho do site. PNG, JPG, GIF até 1MB. Recomendado: logo claro ou com contorno para boa visualização em fundos escuros.</p>
          </div>

          <div>
            <label htmlFor="logoUrlLightBg" className="block text-sm font-medium text-gray-200 mb-1">Logo para Fundo Claro (PDFs)</label>
            {companyInfo.logoUrlLightBg && (
              <img src={companyInfo.logoUrlLightBg} alt="Logo Light Preview" className="h-20 mb-2 border border-gray-600 rounded p-1 bg-white"/> /* Preview on white bg */
            )}
            <Input
              id="logoUrlLightBg"
              name="logoUrlLightBg"
              type="file"
              accept="image/*"
              onChange={(e) => handleLogoChange(e, 'light')}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600"
            />
             <p className="mt-1 text-xs text-gray-400">Ideal para orçamentos e recibos em PDF. PNG, JPG, GIF até 1MB. Recomendado: logo escuro ou colorido para boa visualização em fundos claros.</p>
          </div>
        </div>

        <Textarea
          label="Endereço"
          id="address"
          name="address"
          value={companyInfo.address}
          onChange={handleChange}
          rows={3}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Telefone"
            id="phone"
            name="phone"
            type="tel"
            value={companyInfo.phone}
            onChange={handleChange}
          />
          <Input
            label="Email"
            id="email"
            name="email"
            type="email"
            value={companyInfo.email}
            onChange={handleChange}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Input
            label="Instagram (Opcional)"
            id="instagram"
            name="instagram"
            type="text"
            value={companyInfo.instagram || ''}
            onChange={handleChange}
            placeholder="Ex: @suaempresa ou https://instagram.com/suaempresa"
          />
          <Input
            label="Website (Opcional)"
            id="website"
            name="website"
            type="url"
            value={companyInfo.website || ''}
            onChange={handleChange}
            placeholder="Ex: https://www.suaempresa.com.br"
          />
        </div>
        <Input
          label="CNPJ (Opcional)"
          id="cnpj"
          name="cnpj"
          type="text"
          value={companyInfo.cnpj || ''}
          onChange={handleChange}
        />
        
        <div className="pt-4">
          <Button type="submit" variant="primary" size="lg">
            Salvar Informações
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CompanySettingsPage;