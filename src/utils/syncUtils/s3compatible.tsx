import { restore } from "./restoreUtil";
import StorageUtil from "../serviceUtils/storageUtil";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import axios from "axios";

class S3Util {
  static UploadFile = async (blob: any) => {
    return new Promise<boolean>(async (resolve, reject) => {
      let { endpoint, region, bucketName, accessKeyId, secretAccessKey } =
        JSON.parse(StorageUtil.getReaderConfig("s3compatible_token") || "{}");

      const arrayBuffer = await blob.arrayBuffer();
      const filename = uuid() + ".zip";
      // Create an S3 client
      //
      // You must copy the endpoint from your B2 bucket details
      // and set the region to match.
      const s3 = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: filename,
            Body: Buffer.from(arrayBuffer),
          })
        );
        StorageUtil.setReaderConfig("s3FileName", filename);
        resolve(true);
      } catch (err) {
        console.log("Error: ", err);
        resolve(false);
      }
    });
  };
  static DownloadFile = async () => {
    return new Promise<boolean>(async (resolve, reject) => {
      const filename = "data.zip";
      let { endpoint, region, bucketName, accessKeyId, secretAccessKey } =
        JSON.parse(StorageUtil.getReaderConfig("s3compatible_token") || "{}");
      const s3 = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      let url = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: bucketName,
          Key: StorageUtil.getReaderConfig("s3FileName"),
        })
      );

      try {
        const response = await axios.get(url, {
          headers: {},
          responseType: "blob", // 指定响应类型为 Blob，以便处理文件
        });

        // 从响应中获取文件数据
        const blob = new Blob([response.data], {
          type: response.headers["content-type"],
        });

        let fileTemp = new File([blob], filename, {
          lastModified: new Date().getTime(),
          type: blob.type,
        });
        let result = await restore(fileTemp);
        if (!result) resolve(false);
      } catch (error) {
        console.error("Error occurred during file download:", error);
      }
      resolve(true);
    });
  };
}

export default S3Util;
