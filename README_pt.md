<div align="left">

[简体中文](https://github.com/koodo-reader/koodo-reader/blob/master/README_cn.md) | [हिंदी](https://github.com/koodo-reader/koodo-reader/blob/master/README_hi.md) | Português | [English](https://github.com/koodo-reader/koodo-reader/blob/master/README.md) | [Indonesian](https://github.com/koodo-reader/koodo-reader/blob/master/README_id.md)

</div>

<div align="center" >
  <img src="https://dl.koodoreader.com/screenshots/logo.png" width="96px" height="96px"/>
</div>

<h1 align="center">
  Koodo Reader
</h1>

<h3 align="center">
  Um leitor de livros digitais multiplataforma
</h3>
<div align="center">

[Baixar](https://koodoreader.com/en) | [Pré-visualizar](https://web.koodoreader.com) | [Roadmap](https://koodoreader.com/en/roadmap) | [Documento](https://koodoreader.com/en/document)

</div>

## Pré-visualizar

<div align="center">
  <br/>
  <br/>
  <img src="https://dl.koodoreader.com/screenshots/7.png" width="800px">
  <br/>
  <br/>
  <img src="https://dl.koodoreader.com/screenshots/8.png" width="800px">
  <br/>
  <br/>
</div>

## Características

- Formatos suportados:
  - EPUB (**.epub**)
  - PDF (**.pdf**)
  - Formato sem DRM (**.mobi**) e Kindle (**.azw3**, **.azw**)
  - Texto puro (**.txt**)
  - FictionBook (**.fb2**)
  - Arquivo de quadrinhos (**.cbr**, **.cbz**, **.cbt**, **.cb7**)
  - Texto rico (**.md**, **.docx**)
  - Hiper texto (**.html**, **.xml**, **.xhtml**, **.mhtml**, **.htm**)
- Plataformas suportadas : **Windows**, **macOS**, **Linux** e **Web**
- Guarde seus dados no **OneDrive**, **Google Drive**, **Dropbox**, **Yandex Disk**, **FTP**, **SFTP**, **WebDAV**, **SMB**, **S3**, **S3 Compatible**
- Personalize a pasta de origem e sincronize entre varios dispositivos usando OneDrive, iCloud, Dropbox, etc..
- Layouts de uma coluna, duas colunas ou de rolagem continua
- Text para fala, tradução, controles deslizante de progresso, suporte a tela sensível ao toque, importação em lote
- Adicione marcadores, notas e destaques aos seus livros
- Ajuste o tamanho da fonte, tipo da fonte, espaçamento entre linhas, espaçamento entre parágrafos, cor de fundo, cor do texto, margens e brilho
- Modo noturno e cores nos temas
- Destaque de texto, sublinhado, negrito, itálico e sombra

## Instalação

- Versão para computador:
  - Versão estável (Recomendada): [Baixar](https://koodoreader.com/en)
  - Versão do desenvolvedor: [Baixar](https://github.com/koodo-reader/koodo-reader/releases/latest) ( Com novos recursos e correção de bugs, mas podendo ainda conter alguns problemas desconhecidos)
- Versão para Web：[Pré-visualizar](https://web.koodoreader.com)
- Instalar com o Scoop:

```shell
scoop bucket add extras
scoop install extras/koodo-reader
```

- Instalar com o Homebrew:

```shell
brew install --cask koodo-reader
```

- Instalar com o Docker:

```bash
docker run -d -p 80:80 --name koodo-reader ghcr.io/koodo-reader/koodo-reader:master
```

## Capturas de tela

<div align="center">
  <b>Lista de livros</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/1.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>exposição de livro</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/5.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>Modo em lista</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/2.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>Modo de capa</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/3.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>Opções de leitura</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/6.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>Modo escuro e cores do tema</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/4.png" width="800px"></kbd>
  <br/>
  <br/>
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
