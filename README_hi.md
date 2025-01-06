<div align="left">

[简体中文](https://github.com/koodo-reader/koodo-reader/blob/master/README_cn.md) | [English](https://github.com/koodo-reader/koodo-reader/blob/master/README.md) | हिंदी |[Português](https://github.com/koodo-reader/koodo-reader/blob/master/README_pt.md)

</div>

<div align="center" >
  <img src="https://dl.koodoreader.com/screenshots/logo.png" width="96px" height="96px"/>
</div>

<h1 align="center">
  कूडो रीडर
</h1>

<h3 align="center">
  एक क्रॉस-प्लेटफ़ॉर्म ईबुक रीडर
</h3>
<div align="center">

[डाउनलोड](https://koodoreader.com/en) | [समीक्षा](https://web.koodoreader.com) | [रोडमैप](https://koodoreader.com/en/roadmap) | [आलेख](https://koodoreader.com/en/document)

</div>

## समीक्षा

<div align="center">
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/1.png" width="800px"></kbd>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/5.png" width="800px"></kbd>
  <br/>
</div>

## विशेषता

- प्रारूप:
  - EPUB (**.epub**)
  - PDF (**.pdf**)
  - डीआरएम मुक्त मोबिपॉकेट (**.mobi**) और Kindle (**.azw3**, **.azw**)
  - प्लेन टेक्स्ट (**.txt**)
  - उपन्यास पुस्तक (**.fb2**)
  - हास्य पुस्तक पुरालेख (**.cbr**, **.cbz**, **.cbt**, **.cb7**)
  - रिच टेक्स्ट (**.md**, **.docx**)
  - हाइपरटेक्सट (**.html**, **.xml**, **.xhtml**, **.mhtml**, **.htm**)
- प्लेटफार्म: **Windows**, **macOS**, **Linux** and **Web**
- अपना डेटा यहां सहेजें **OneDrive**, **Google Drive**, **Dropbox**, **FTP**, **SFTP**, **WebDAV**, **S3**, **S3 Compatible**
- स्रोत फ़ोल्डर को कस्टमाइज़ करें और वनड्राइव, आईक्लाउड, ड्रॉपबॉक्स आदि का उपयोग करके कई डिवाइसों के बीच सिंक्रनाइज़ करें।
- एकल-स्तंभ, दो-स्तंभ, या निरंतर स्क्रॉलिंग लेआउट
- टेक्स्ट-टू-स्पीच, अनुवाद, शब्दकोश, टच स्क्रीन समर्थन, बैच आयात
- अपनी पुस्तकों में बुकमार्क, नोट्स, हाइलाइट्स जोड़ें
- फ़ॉन्ट आकार, फ़ॉन्ट परिवार, लाइन-स्पेसिंग, पैराग्राफ़ रिक्ति, पृष्ठभूमि रंग, टेक्स्ट रंग, मार्जिन और द्य्रुति समायोजित करें
- रात्रि मोड और थीम रंग
- टेक्स्ट हाइलाइट, अंडरलाइन, बोल्डनेस, इटैलिक और शैडो

## इंस्टालेशन

- डेस्कटॉप संस्करण:
  - स्थिर संस्करण (अनुशंसित): [डाउनलोड](https://koodoreader.com/en)
  - डेवलपर संस्करण: [डाउनलोड](https://github.com/koodo-reader/koodo-reader/releases/latest) ( नई सुविधा और बग फिक्स के साथ, लेकिन कुछ अज्ञात बग उत्पन्न हो सकते हैं)
- वेब संस्करण：[समीक्षा](https://web.koodoreader.com)
- स्कूप के साथ इंस्टाल करें:

```shell
scoop bucket add extras
scoop install extras/koodo-reader
```

- होमब्रू के साथ इंस्टॉल करें:

```shell
brew install --cask koodo-reader
```

- डॉकर के साथ इंस्टॉल करें:

```bash
docker run -d -p 80:80 --name koodo-reader ghcr.io/koodo-reader/koodo-reader:master
```

## स्क्रीनशॉट

<div align="center">
  <br/>
  <b>सूची मोड</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/2.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>कवर मोड</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/3.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>पाठक मेनू</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/6.png" width="800px"></kbd>
  <br/>
  <br/>
  <b>डार्क मोड</b>
  <br/>
  <br/>
  <kbd><img src="https://dl.koodoreader.com/screenshots/4.png" width="800px"></kbd>
  <br/>
</div>

</div>

## विकास

सुनिश्चित करें कि आपने यार्न और गिट इंस्टॉल किया है

1. रेपो डाउनलोड करें

   ```
   git clone https://github.com/koodo-reader/koodo-reader.git
   ```

2. डेस्कटॉप मोड में प्रवेश करें

   ```
   yarn
   yarn dev
   ```

3. वेब मोड में प्रवेश करें

   ```
   yarn
   yarn start
   ```
