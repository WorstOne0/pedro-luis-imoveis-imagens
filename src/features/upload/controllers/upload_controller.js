import fs from "fs";
import path from "path";
import config from "../../../config/upload.js";

const UPLOAD_DIR = path.resolve(config.UPLOAD_DIR);

// process_upload has already written the final files; this only maps them to
// public urls.
const toPublicUrl = (file) => ({
  path: `${process.env.HOST}/images/${file.filename}`,
  size: file.size,
});

export default {
  async uploadSingle(req, res) {
    try {
      const [file] = req.processedFiles ?? [];
      if (!file) return res.status(400).json({ status: 400, message: "Nenhum arquivo enviado" });

      return res.status(200).json({ status: 200, payload: toPublicUrl(file), message: "Ok!" });
    } catch (error) {
      console.log("Error - upload_controller.js - uploadSingle", error);
      return res.status(500).json({ status: 500, message: "Erro ao salvar arquivo" });
    }
  },
  async uploadMany(req, res) {
    try {
      const files = req.processedFiles ?? [];
      if (files.length === 0) return res.status(400).json({ status: 400, message: "Nenhum arquivo enviado" });

      return res.status(200).json({ status: 200, payload: files.map(toPublicUrl), message: "Ok!" });
    } catch (error) {
      console.log("Error - upload_controller.js - uploadMany", error);
      return res.status(500).json({ status: 500, message: "Erro ao salvar arquivos" });
    }
  },
  async delete(req, res) {
    try {
      const { filename } = req.body;
      if (!filename) return res.status(400).json({ status: 400, message: "Informe o arquivo" });

      // basename strips any traversal ("../../.env"), and the resolved path is
      // re-checked so nothing outside public/ can ever be removed.
      const target = path.resolve(UPLOAD_DIR, path.basename(String(filename)));
      if (path.dirname(target) !== UPLOAD_DIR) return res.status(400).json({ status: 400, message: "Arquivo inválido" });

      if (!fs.existsSync(target)) return res.status(404).json({ status: 404, message: "Arquivo não encontrado" });

      fs.rmSync(target);

      return res.status(200).json({ status: 200, payload: path.basename(target), message: "Ok!" });
    } catch (error) {
      console.log("Error - upload_controller.js - delete", error);
      return res.status(500).json({ status: 500, message: "Erro ao remover arquivo" });
    }
  },
};
