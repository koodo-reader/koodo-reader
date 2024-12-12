<div align="left">

[简体中文](https://github.com/koodo-reader/koodo-reader/blob/master/README_cn.md) | [English](https://github.com/koodo-reader/koodo-reader/blob/master/README.md) | తెలుగు |[Português](https://github.com/koodo-reader/koodo-reader/blob/master/README_pt.md)

</div>

<div align="center" >
  <img src="https://dl.koodoreader.com/screenshots/logo.png" width="96px" height="96px"/>
</div>

<h1 align="center">
  కూడో రీడర్
</h1>

<h3 align="center">
  ఒక క్రాస్-ప్లాట్‌ఫారమ్ ఈబుక్ రీడర్
</h3>
<div align="center">

[డౌన్లోడ్](https://koodoreader.com/en) | [సమీక్ష](https://web.koodoreader.com) | [రోడ్‌మ్యాప్](https://koodoreader.com/en/roadmap) | [ఆధారం](https://koodoreader.com/en/document)

</div>

## సమీక్ష

<div align="center">
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/1.png" width="800px"></kbd>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/5.png" width="800px"></kbd>
  <br/>
</div>

## లక్షణాలు

- ఫార్మాట్:
  - EPUB (**.epub**)
  - PDF (**.pdf**)
  - DRM ఫ్రీ మొబిపాకెట్ (**.mobi**) మరియు Kindle (**.azw3**, **.azw**)
  - ప్లెయిన్ టెక్ట్స్ (**.txt**)
  - నవల పుస్తకం (**.fb2**)
  - కామిక్స్ పుస్తకం ఆర్కైవ్ (**.cbr**, **.cbz**, **.cbt**, **.cb7**)
  - రిచ్ టెక్ట్స్ (**.md**, **.docx**)
  - హైపర్‌టెక్స్ట్ (**.html**, **.xml**, **.xhtml**, **.mhtml**, **.htm**)
- ప్లాట్‌ఫార్మ్: **Windows**, **macOS**, **Linux** మరియు **Web**
- మీ డేటాను ఇక్కడ సేవ్ చేయండి **OneDrive**, **Google Drive**, **Dropbox**, **FTP**, **SFTP**, **WebDAV**, **S3**, **S3 అనుకూలం**
- సోర్స్ ఫోల్డర్‌ను కస్టమైజ్ చేయండి మరియు OneDrive, iCloud, Dropbox మొదలైన వాటితో అనేక పరికరాల మధ్య సింక్రనైజ్ చేయండి
- సింగిల్-కలమ్, డ్యూబుల్-కలమ్ లేదా కంటిన్యూ స్క్రోల్ లేఅవుట్
- టెక్ట్స్-టు-స్పీచ్, అనువాదం, డిక్షనరీ, టచ్ స్క్రీన్ మద్దతు, బ్యాచ్ ఇంపోర్ట్
- మీ పుస్తకాల్లో బుక్‌మార్కులు, నోట్స్, హైలైట్స్ జోడించండి
- ఫాంట్ పరిమాణం, ఫాంట్ కుటుంబం, లైన్-స్పేసింగ్, పేరాగ్రాఫ్ ఖాళీ, బ్యాక్‌గ్రౌండ్ రంగు, టెక్ట్స్ రంగు, మార్జిన్ మరియు దృశ్యాన్ని సర్దుబాటు చేయండి
- నైట్ మోడ్ మరియు థీమ్ రంగు
- టెక్ట్స్ హైలైట్, అండర్‌లైన్, బోల్డ్‌నెస్, ఇటాలిక్ మరియు షాడో

## సంస్థాపన

- డెస్క్‌టాప్ వెర్షన్:
  - స్థిరమైన వెర్షన్ (సిఫార్సు): [డౌన్లోడ్](https://koodoreader.com/en)
  - డెవలపర్ వెర్షన్: [డౌన్లోడ్](https://github.com/koodo-reader/koodo-reader/releases/latest) (కొత్త ఫీచర్లు మరియు బగ్ ఫిక్సులతో, కానీ కొన్ని తెలియని బగ్స్ తలెత్తవచ్చు)
- వెబ్ వెర్షన్：[సమీక్ష](https://web.koodoreader.com)
- స్కూప్‌తో సంస్థాపించండి:

```shell
scoop bucket add extras
scoop install extras/koodo-reader

    డాకర్‌తో సంస్థాపించండి:

docker run -d -p 80:80 --name koodo-reader ghcr.io/koodo-reader/koodo-reader:master

స్క్రీన్‌షాట్లు
<div align="center"> <br/> <b>లిస్ట్ మోడ్</b> <br/> <br/> <kbd><img src="https://dl.koodoreader.com/screenshots/2.png" width="800px"></kbd> <br/> <br/> <b>కవర్ మోడ్</b> <br/> <br/> <kbd><img src="https://dl.koodoreader.com/screenshots/3.png" width="800px"></kbd> <br/> <br/> <b>పఠన మెనూ</b> <br/> <br/> <kbd><img src="https://dl.koodoreader.com/screenshots/6.png" width="800px"></kbd> <br/> <br/> <b>డార్క్ మోడ్</b> <br/> <br/> <kbd><img src="https://dl.koodoreader.com/screenshots/4.png" width="800px"></kbd> <br/> </div> </div>
అభివృద్ధి

మీరు Yarn మరియు Git ఇన్స్టాల్ చేసారనే విషయాన్ని నిర్ధారించుకోండి

    రెపోని డౌన్లోడ్ చేయండి

git clone https://github.com/koodo-reader/koodo-reader.git

డెస్క్‌టాప్ మోడ్‌లో ప్రవేశించండి

yarn
yarn dev

వెబ్ మోడ్‌లో ప్రవేశించండి

    yarn
    yarn start

You said:
continue
ChatGPT said:
ChatGPT

Here is the continuation of the translation:

## అభివృద్ధి (కొనసాగింపు)

4. వెబ్ మరియు డెస్క్‌టాప్ మోడ్‌లను బిల్డ్ చేయండి

   - వెబ్ మోడ్:
     ```bash
     yarn build:web
     ```

   - డెస్క్‌టాప్ మోడ్:
     ```bash
     yarn build:desktop
     ```

5. మీ మార్పులను పరీక్షించండి

   వెబ్ లేదా డెస్క్‌టాప్ అనుభవం కోసం, మీరు చేసిన మార్పులను సులభంగా ధృవీకరించవచ్చు.

## లైసెన్స్

ఈ ప్రాజెక్ట్ MIT లైసెన్సుతో లభిస్తుంది - మరింత సమాచారం కోసం [LICENSE](https://github.com/koodo-reader/koodo-reader/blob/master/LICENSE) ఫైల్‌ని చూడండి.
