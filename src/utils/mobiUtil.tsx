function ab2str(buf) {
  if (buf instanceof ArrayBuffer) {
    buf = new Uint8Array(buf);
  }
  return new TextDecoder("utf-8").decode(buf);
}

var domParser = new DOMParser();

class Buffer {
  capacity: any;
  fragment_list: any;
  imageArray: any;
  cur_fragment: Fragment;
  constructor(capacity) {
    this.capacity = capacity;
    this.fragment_list = [];
    this.imageArray = [];
    this.cur_fragment = new Fragment(capacity);
    this.fragment_list.push(this.cur_fragment);
  }
  write(byte) {
    var result = this.cur_fragment.write(byte);
    if (!result) {
      this.cur_fragment = new Fragment(this.capacity);
      this.fragment_list.push(this.cur_fragment);
      this.cur_fragment.write(byte);
    }
  }
  get(idx) {
    var fi = 0;
    while (fi < this.fragment_list.length) {
      var frag = this.fragment_list[fi];
      if (idx < frag.size) {
        return frag.get(idx);
      }
      idx -= frag.size;
      fi += 1;
    }
    return null;
  }
  size() {
    var s = 0;
    for (var i = 0; i < this.fragment_list.length; i++) {
      s += this.fragment_list[i].size;
    }
    return s;
  }
  shrink() {
    var total_buffer = new Uint8Array(this.size());
    var offset = 0;
    for (var i = 0; i < this.fragment_list.length; i++) {
      var frag = this.fragment_list[i];
      if (frag.full()) {
        total_buffer.set(frag.buffer, offset);
      } else {
        total_buffer.set(frag.buffer.slice(0, frag.size), offset);
      }
      offset += frag.size;
    }
    return total_buffer;
  }
}

var copagesne_uint8array = function (buffers) {
  var total_size = 0;
  for (let i = 0; i < buffers.length; i++) {
    var buffer = buffers[i];
    total_size += buffer.length;
  }
  var total_buffer = new Uint8Array(total_size);
  var offset = 0;
  for (let i = 0; i < buffers.length; i++) {
    buffer = buffers[i];
    total_buffer.set(buffer, offset);
    offset += buffer.length;
  }
  return total_buffer;
};

class Fragment {
  buffer: Uint8Array;
  capacity: any;
  size: number;
  constructor(capacity) {
    this.buffer = new Uint8Array(capacity);
    this.capacity = capacity;
    this.size = 0;
  }

  write(byte) {
    if (this.size >= this.capacity) {
      return false;
    }
    this.buffer[this.size] = byte;
    this.size += 1;
    return true;
  }
  full() {
    return this.size === this.capacity;
  }
  get(idx) {
    return this.buffer[idx];
  }
}

var uncompression_lz77 = function (data) {
  var length = data.length;
  var offset = 0; // Current offset into data
  var buffer = new Buffer(data.length);

  while (offset < length) {
    var char = data[offset];
    offset += 1;

    if (char === 0) {
      buffer.write(char);
    } else if (char <= 8) {
      for (var i = offset; i < offset + char; i++) {
        buffer.write(data[i]);
      }
      offset += char;
    } else if (char <= 0x7f) {
      buffer.write(char);
    } else if (char <= 0xbf) {
      var next = data[offset];
      offset += 1;
      var distance = (((char << 8) | next) >> 3) & 0x7ff;
      var lz_length = (next & 0x7) + 3;

      var buffer_size = buffer.size();
      for (let i = 0; i < lz_length; i++) {
        buffer.write(buffer.get(buffer_size - distance));
        buffer_size += 1;
      }
    } else {
      buffer.write(32);
      buffer.write(char ^ 0x80);
    }
  }
  return buffer;
};

class MobiFile {
  view: DataView;
  buffer: ArrayBuffer;
  offset: number;
  header: any;
  palm_header: any;
  mobi_header: any;
  reclist: any;
  constructor(data) {
    this.view = new DataView(data);
    this.buffer = this.view.buffer;
    this.offset = 0;
    this.header = null;
  }

  parse() {}

  getUint8() {
    var v = this.view.getUint8(this.offset);
    this.offset += 1;
    return v;
  }

  getUint16() {
    var v = this.view.getUint16(this.offset);
    this.offset += 2;
    return v;
  }

  getUint32() {
    var v = this.view.getUint32(this.offset);
    this.offset += 4;
    return v;
  }

  getStr(size) {
    var v = ab2str(this.buffer.slice(this.offset, this.offset + size));
    this.offset += size;
    return v;
  }

  skip(size) {
    this.offset += size;
  }

  setoffset(_of) {
    this.offset = _of;
  }

  get_record_extrasize(data, flags) {
    var pos = data.length - 1;
    var extra = 0;
    for (var i = 15; i > 0; i--) {
      if (flags & (1 << i)) {
        var res = this.buffer_get_varlen(data, pos);
        var size = res[0];
        var l = res[1];
        pos = res[2];
        pos -= size - l;
        extra += size;
      }
    }
    if (flags & 1) {
      var a = data[pos];
      extra += (a & 0x3) + 1;
    }
    return extra;
  }

  // data should be uint8array
  buffer_get_varlen(data, pos) {
    var l = 0;
    var size = 0;
    var byte_count = 0;
    var mask = 0x7f;
    var stop_flag = 0x80;
    var shift = 0;
    for (var i = 0; ; i++) {
      var byte = data[pos];
      size |= (byte & mask) << shift;
      shift += 7;
      l += 1;
      byte_count += 1;
      pos -= 1;

      var to_stop = byte & stop_flag;
      if (byte_count >= 4 || to_stop > 0) {
        break;
      }
    }
    return [size, l, pos];
  }
  // 读出文本内容
  read_text() {
    var text_end = this.palm_header.record_count;
    var buffers: any = [];
    for (var i = 1; i <= text_end; i++) {
      buffers.push(this.read_text_record(i));
    }
    var all = copagesne_uint8array(buffers);
    return ab2str(all);
  }

  read_text_record(i) {
    var flags = this.mobi_header.extra_flags;
    var begin = this.reclist[i].offset;
    var end = this.reclist[i + 1].offset;

    var data = new Uint8Array(this.buffer.slice(begin, end));
    var ex = this.get_record_extrasize(data, flags);

    data = new Uint8Array(this.buffer.slice(begin, end - ex));
    if (this.palm_header.compression === 2) {
      var buffer = uncompression_lz77(data);
      return buffer.shrink();
    } else {
      return data;
    }
  }
  // 从buffer中读出image
  read_image(idx) {
    var first_image_idx = this.mobi_header.first_image_idx;
    var begin = this.reclist[first_image_idx + idx].offset;
    var end = this.reclist[first_image_idx + idx + 1].offset;
    var data = new Uint8Array(this.buffer.slice(begin, end));
    return new Blob([data.buffer]);
  }

  load() {
    this.header = this.load_pdbheader();
    this.reclist = this.load_reclist();
    this.load_record0();
  }

  load_pdbheader() {
    var header: any = {};
    header.name = this.getStr(32);
    header.attr = this.getUint16();
    header.version = this.getUint16();
    header.ctime = this.getUint32();
    header.mtime = this.getUint32();
    header.btime = this.getUint32();
    header.mod_num = this.getUint32();
    header.appinfo_offset = this.getUint32();
    header.sortinfo_offset = this.getUint32();
    header.type = this.getStr(4);
    header.creator = this.getStr(4);
    header.uid = this.getUint32();
    header.next_rec = this.getUint32();
    header.record_num = this.getUint16();
    return header;
  }

  load_reclist() {
    var reclist: any = [];
    for (var i = 0; i < this.header.record_num; i++) {
      var record: any = {};
      record.offset = this.getUint32();
      // TODO(zz) change
      record.attr = this.getUint32();
      reclist.push(record);
    }
    return reclist;
  }
  load_record0() {
    this.palm_header = this.load_record0_header();
    this.mobi_header = this.load_mobi_header();
  }

  load_record0_header() {
    var p_header: any = {};
    var first_record = this.reclist[0];
    this.setoffset(first_record.offset);

    p_header.compression = this.getUint16();
    this.skip(2);
    p_header.text_length = this.getUint32();
    p_header.record_count = this.getUint16();
    p_header.record_size = this.getUint16();
    p_header.encryption_type = this.getUint16();
    this.skip(2);

    return p_header;
  }

  load_mobi_header() {
    var mobi_header: any = {};

    var start_offset = this.offset;

    mobi_header.identifier = this.getUint32();
    mobi_header.header_length = this.getUint32();
    mobi_header.mobi_type = this.getUint32();
    mobi_header.text_encoding = this.getUint32();
    mobi_header.uid = this.getUint32();
    mobi_header.generator_version = this.getUint32();

    this.skip(40);

    mobi_header.first_nonbook_index = this.getUint32();
    mobi_header.full_name_offset = this.getUint32();
    mobi_header.full_name_length = this.getUint32();

    mobi_header.language = this.getUint32();
    mobi_header.input_language = this.getUint32();
    mobi_header.output_language = this.getUint32();
    mobi_header.min_version = this.getUint32();
    mobi_header.first_image_idx = this.getUint32();

    mobi_header.huff_rec_index = this.getUint32();
    mobi_header.huff_rec_count = this.getUint32();
    mobi_header.datp_rec_index = this.getUint32();
    mobi_header.datp_rec_count = this.getUint32();

    mobi_header.exth_flags = this.getUint32();

    this.skip(36);

    mobi_header.drm_offset = this.getUint32();
    mobi_header.drm_count = this.getUint32();
    mobi_header.drm_size = this.getUint32();
    mobi_header.drm_flags = this.getUint32();

    this.skip(8);

    // TODO (zz) fdst_index
    this.skip(4);

    this.skip(46);

    mobi_header.extra_flags = this.getUint16();

    this.setoffset(start_offset + mobi_header.header_length);

    return mobi_header;
  }
  load_exth_header() {
    // TODO
    return {};
  }
  extractContent(s) {
    var span = document.createElement("span");
    span.innerHTML = s;
    return span.textContent || span.innerText;
  }
  render(handleMessage, handleMessageBox) {
    return new Promise((resolve, reject) => {
      this.load();
      var content = this.read_text();
      var bookDoc = domParser.parseFromString(content, "text/html")
        .documentElement;
      const lines: any = Array.from(bookDoc.querySelectorAll("p,b,font,h3"));

      let parseContent: any = [];
      for (let i = 0, len = lines.length; i < len - 1; i++) {
        parseContent.push(
          lines[i].tagName === "FONT" ||
            lines[i].tagName === "B" ||
            lines[i].tagName === "H3"
            ? "*" + lines[i].innerText
            : lines[i].innerText
        );
        let imgDoms = lines[i].getElementsByTagName("img");
        if (imgDoms.length > 0) {
          for (let i = 0; i < imgDoms.length; i++) {
            parseContent.push("#image");
          }
        }
      }
      const handleImage = async () => {
        var imgDoms = bookDoc.getElementsByTagName("img");
        if (imgDoms.length > 500) {
          handleMessage("Too many images");
          handleMessageBox(true);
          resolve(parseContent.join("\n    \n"));
        }
        parseContent.push("~image");
        for (let i = 0; i < imgDoms.length; i++) {
          const src = await this.render_image(imgDoms, i);
          parseContent.push(
            src + " " + imgDoms[i].width + " " + imgDoms[i].height
          );
        }
        resolve(parseContent.join("\n    \n"));
      };
      handleImage();
    });
  }
  render_image = (imgDoms, i) => {
    return new Promise((resolve, reject) => {
      var imgDom = imgDoms[i];
      var idx = +imgDom.getAttribute("recindex");
      var blob = this.read_image(idx - 1);
      var imgReader = new FileReader();
      imgReader.onload = (e) => {
        imgDom.src = e.target?.result;
        resolve(e.target?.result);
      };
      imgReader.onerror = function (err) {
        reject(err);
      };
      imgReader.readAsDataURL(blob);
    });
  };
}

export default MobiFile;
