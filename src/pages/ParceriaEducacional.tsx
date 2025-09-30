import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Diferenciais from '@/components/Diferenciais';
import Modalidades from '@/components/Modalidades';

const ParceriaEducacional = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      nome,
      email,
      telefone,
    };

    try {
      const response = await fetch('https://hook.us2.make.com/53wwy6sx32sr4w7whgr8t4pks9mk5j66', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        window.location.href = 'https://wa.me/559220201260?text=Ol%C3%A1%2C%20vim%20pela%20parceria%20educacional%20e%20gostaria%20de%20garantir%20minha%20bolsa%20de%20estudos.';
      } else {
        alert('Erro ao enviar o formulário.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao enviar o formulário.');
    }
  };

  return (
    <div className="container py-12">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Formulário Parceria Educacional UniCV
          </h2>
          <p className="text-muted-foreground">
            Preencha o formulário para ganha uma bolsa exclusiva de 40% de Desconto + Taxa de Matricula com 50% de desconto.
          </p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold tracking-tight">
              Informações de Contato
            </h3>
            <p className="text-sm text-muted-foreground">
              Nos informe seus dados para que possamos entrar em contato.
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Digite seu nome"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="Digite seu email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  type="tel"
                  id="phone"
                  placeholder="Digite seu telefone"
                  required
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </div>
              <Button type="submit">Enviar</Button>
            </form>
          </div>
        </div>
      </div>

      <div className="py-12">
        <Diferenciais />
      </div>

    

      <div className="py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Sobre a UniCV</h2>
        <p className="text-muted-foreground">
          A UniCV é uma instituição de ensino superior comprometida com a excelência acadêmica e a formação de profissionais capacitados para o mercado de trabalho.
        </p>
        
        <p className="text-muted-foreground text-center pt-6">
          Todos os direitos reservados. UniCV 2025
        </p>


      </div>
    </div>
  );
};

export default ParceriaEducacional;