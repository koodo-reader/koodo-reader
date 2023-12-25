<div align="left">

[简体中文](https://github.com/koodo-reader/koodo-reader/blob/master/README_cn.md) | Português | [English](https://github.com/koodo-reader/koodo-reader/blob/master/README.md)

</div>

<div align="center" >
  <img src="https://i.loli.net/2021/07/30/ZKNMmz54Q3uqlrW.png" width="96px" height="96px"/>
</div>

<h1 align="center">
  Koodo Reader
</h1>

<h3 align="center">
  Um leitor de livros digitais multiplataforma
</h3>
<div align="center">

[Baixar](https://koodo.960960.xyz/en) | [Pré-visualizar](https://reader.960960.xyz) | [Roadmap](https://troyeguo.notion.site/d1c19a132932465bae1d89dd963c92ea?v=ca8aa69cf25849c18c92b92ba868663b) | [Documento](https://troyeguo.notion.site/Koodo-Reader-Documento-9c767af3d66c459db996bdd08a34c34b)

</div>

## Pré-visualizar

<div align="center">
  <img src="https://i.loli.net/2021/08/08/I37WPYFJcC1jltn.png" >
  <img src="https://i.loli.net/2021/08/08/G7WvUQFTrEpSCKg.png" >
</div>

## Características

- Formatos suportados:
  - EPUB (**.epub**)
  - Documento scaneados (**.pdf**, **.djvu**)
  - Formato sem DRM (**.mobi**) e Kindle (**.azw3**, **.azw**)
  - Texto puro (**.txt**)
  - FictionBook (**.fb2**)
  - Arquivo de quadrinhos (**.cbr**, **.cbz**, **.cbt**, **.cb7**)
  - Texto rico (**.md**, **.docx**)
  - Hiper texto (**.html**, **.xml**, **.xhtml**, **.mhtml**, **.htm**, **.htm**)
- Plataformas suportadas : **Windows**, **macOS**, **Linux** e **Web**
- Guarde seus dados no **Dropbox** ou **WebDAV**
- Personalize a pasta de origem e sincronize entre varios dispositivos usando OneDrive, iCloud, Dropbox, etc..
- Layouts de uma coluna, duas colunas ou de rolagem continua
- Text para fala, tradução, controles deslizante de progresso, suporte a tela sensível ao toque, importação em lote
- Adicione marcadores, notas e destaques aos seus livros
- Ajuste o tamanho da fonte, tipo da fonte, espaçamento entre linhas, espaçamento entre parágrafos, cor de fundo, cor do texto, margens e brilho
- Modo noturno e cores nos temas
- Destaque de texto, sublinhado, negrito, itálico e sombra

## Instalação

- Versão para computador:
  - Versão estável (Recomendada): [Baixar](https://koodo.960960.xyz/en)
  - Versão do desenvolvedor: [Baixar](https://github.com/koodo-reader/koodo-reader/releases/latest) ( Com novos recursos e correção de bugs, mas podendo ainda conter alguns problemas desconhecidos)
- Versão para Web：[Pré-visualizar](https://reader.960960.xyz)
- Instalar com o Scoop:

```shell
scoop bucket add extras
scoop install extras/koodo-reader
```

- Instalar com o Winget:

```shell
winget install -e AppbyTroye.KoodoReader
```

- Instalar com o Homebrew:

```shell
brew install --cask koodo-reader
```

- Instalar com o Docker:

```bash
docker-compose up -d
```

- Instalar Flathub:

```shell
flatpak install flathub io.github.troyeguo.koodo-reader
flatpak run io.github.troyeguo.koodo-reader
```

<a href="https://flathub.org/apps/details/io.github.troyeguo.koodo-reader"><img height="50" alt="Download on Flathub" src="https://flathub.org/assets/badges/flathub-badge-en.png"/></a>

## Capturas de tela

<div align="center">
  <b>Modo em lista</b>
  <img src="https://i.loli.net/2021/08/08/JyNHfThMs184Um2.png" >
  <b>Modo de capa</b>
  <img src="https://i.loli.net/2021/08/08/76zkDEAobd4qsmR.png" >
  <b>Opções de leitura</b>
  <img src="https://i.loli.net/2021/08/08/LeEN9gnOvFmfVWA.png" >
  <b>Cópia de segurança e restauração</b>
  <img src="https://i.loli.net/2021/08/08/aRIAiYT2dGJQhC1.png" >
  <b>Modo escuro e cores do tema</b>
  <img src="https://i.loli.net/2021/08/08/ynqUNpX93xZefdw.png" >
  <b>Gerenciamento de notas</b>
  <img src="https://i.loli.net/2021/08/09/sARQBoefvGklHwC.png" >

</div>

</div>

## Desenvolver

Certifique-se de ter instalado yarn e git, a versão.

1. Baixe o repositório

   ```
   git clone https://github.com/koodo-reader/koodo-reader.git
   ```

2. Entre no modo desktop

   ```
   yarn
   yarn dev
   ```

3. Entre no modo web

   ```
   yarn
   yarn start
   ```

## Traduções

Você pode enviar solicitações de pull para editar a tradução atual ou adicionar um novo idioma.
