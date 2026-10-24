# Rede Eclypse — execução local

Abra `Iniciar-Eclypse.cmd` para executar o launcher adaptado. O EXE Warriors-1.0.4.exe é o instalador original e não contém as alterações.

## Jogo

- Minecraft 1.20.1, Forge 47.4.10, Java 17.
- Servidor: redeeclypse.srvmc.com.
- Nove mods da instância fornecida, instalados em uma pasta própria da Eclypse.
- Endereço e identidade: `extracted_launcher/source/launcher-config.json`.
- Distribuição: `extracted_launcher/source/distribution/distribution.json`.
- Integridade local: `extracted_launcher/source/distribution/bundle-lock.json`.

Ao carregar o launcher e antes da verificação do botão Jogar, o pacote local instala ou repara Forge e mods. O fluxo FullRepair do Helios baixa o cliente Minecraft, bibliotecas vanilla e assets necessários. A seleção de Java exige a versão 17 e mantém o instalador de Java existente na interface.

Os arquivos do jogo usam `%APPDATA%/.rede-eclypse`. A variável opcional ECLYPSE_DATA_DIR permite uma pasta isolada para testes. Não foram importados mundos, contas, configurações pessoais ou saves do CurseForge. Links e logos antigos foram mantidos a pedido do usuário.

## Reconstruir o pacote

O Forge precisa ser instalado com seu instalador oficial em `.tools/forge-client` antes de executar `node scripts/build-eclypse-distribution.cjs`. O script também aceita os caminhos da instância e da instalação Forge como primeiro e segundo argumentos. Ele verifica as versões e os hashes das bibliotecas declaradas. Os arquivos gerados incluem o cliente SRG, os patches do Forge, bibliotecas e mods.

O instalador oficial usado nesta preparação é Forge 1.20.1-47.4.10. A instância CurseForge original permanece intacta.

## Runtime local

O atalho usa Electron 44.9.0 em `.tools/electron`. Para reinstalar esse runtime:

```powershell
npm.cmd install --prefix .tools/electron --no-audit --no-fund --save-exact electron@44.9.0
node .tools/electron/node_modules/electron/install.js
```

O código usa @electron/remote 2.1.3, necessário para o runtime atualizado.

## Validação

`node scripts/test-eclypse.cjs` testa instalação local, reparo de corrupção, leitura do manifesto Forge, seleção de Java, resolução das bibliotecas e argumentos de conexão.

`node scripts/test-eclypse.cjs --launch` faz um teste de inicialização em `.test-eclypse`, usando Java e assets locais do CurseForge. Usa um usuário de teste sem autenticação e não conecta ao servidor; o processo é encerrado após 90 segundos.

`scripts/test-launcher.cjs` é um teste executado pelo Electron. A opção `--repair` verifica o fluxo FullRepair na interface sem iniciar uma sessão de jogador.

## Distribuição aos jogadores

Esta versão usa um pacote embutido local; ainda não há hospedagem de atualizações nem novo instalador EXE. Copiar somente o código ou usar o EXE original não distribui esta versão. A publicação de um instalador e a configuração de autenticação Microsoft própria devem ser tratadas antes da distribuição pública.
