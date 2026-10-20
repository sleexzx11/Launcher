# 🚀 Repositório de Distribuição e Atualização — Rede Eclypse

Este repositório é o **servidor de atualização remota** para o Launcher da **Rede Eclypse** (Minecraft Forge 1.20.1), configurado para o usuário **sleexzx**.

Ele hospeda o `distribution.json`, os mods e as bibliotecas do Forge para que os jogadores sempre recebam os mods atualizados automaticamente ao abrir o launcher.

---

## 📋 Como Publicar no seu GitHub (Passo a Passo)

### 1. Crie o repositório na sua conta GitHub
1. Acesse **[github.com/new](https://github.com/new)** logado como **`sleexzx`**.
2. No nome do repositório, coloque: **`rede-eclypse-distro`**
3. Deixe o repositório como **Público** (Public).
4. **Não** marque "Add a README" nem ".gitignore" (já temos tudo pronto nesta pasta).
5. Clique em **Create repository**.

---

### 2. Envie os arquivos do seu computador para o seu GitHub
Abra o terminal PowerShell dentro desta pasta (`C:\Mods\Launcher\rede-eclypse-distro`) e rode estes comandos:

```powershell
git init
git add .
git commit -m "Inicializar servidor de distribuicao Rede Eclypse"
git branch -M main
git remote add origin https://github.com/sleexzx/rede-eclypse-distro.git
git push -u origin main
```

---

### 3. Ative o GitHub Pages na sua conta
1. No seu repositório `https://github.com/sleexzx/rede-eclypse-distro`, clique na aba **Settings** (Configurações).
2. No menu lateral esquerdo, clique em **Pages**.
3. Em **Build and deployment > Source**, selecione:
   * Branch: `main`
   * Folder: `/ (root)`
4. Clique em **Save**.
5. Em 1 minuto, seu servidor de atualizações estará no ar em:  
   👉 `https://sleexzx.github.io/rede-eclypse-distro/distribution.json`

---

## 🔄 Como Atualizar Mods no Futuro

Sempre que você quiser colocar um mod novo, atualizar ou remover:

1. Coloque ou retire o arquivo `.jar` na pasta `instance/mods/`.
2. Dê dois cliques em **`atualizar-distribuicao.cmd`** (ou rode `node generate-distribution.js`).
3. Suba para o seu GitHub:
   ```powershell
   git add .
   git commit -m "Atualizando mods do servidor"
   git push
   ```
Pronto! Todos os jogadores que abrirem o launcher receberão a atualização automaticamente!
