"use client";

import { Check, Copy, QrCode, Share2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import styles from "./tournament-page.module.css";

export function ShareTournamentButton({ name, publicId }: { name: string; publicId: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !url) return;
    let active = true;
    void import("qrcode").then(({ toDataURL }) => toDataURL(url, { margin: 1, width: 240, color: { dark: "#17133e", light: "#ffffff" } }))
      .then((value) => { if (active) setQrDataUrl(value); });
    return () => { active = false; };
  }, [open, url]);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function nativeShare() {
    if (navigator.share) await navigator.share({ title: name, url });
    else await copyLink();
  }

  return <>
    <button type="button" onClick={() => { setUrl(`${window.location.origin}/t/${publicId}`); setOpen(true); }}><Share2 /> Paylaş</button>
    <Modal open={open} title="Turnuvayı Paylaş" onClose={() => setOpen(false)}>
      <div className={styles.shareModal}>
        <p>Herkes bu bağlantıyla turnuva görünümünü oturum açmadan görüntüleyebilir.</p>
        {qrDataUrl ? <Image src={qrDataUrl} alt={`${name} turnuva bağlantısı QR kodu`} className={styles.qrCode} width={184} height={184} unoptimized /> : <div className={styles.qrLoading}><QrCode /> QR kod hazırlanıyor…</div>}
        <label>Paylaşım bağlantısı<input readOnly value={url} aria-label="Paylaşım bağlantısı" /></label>
        <div className={styles.shareActions}><Button type="button" variant="secondary" onClick={copyLink}>{copied ? <><Check /> Kopyalandı</> : <><Copy /> Bağlantıyı Kopyala</>}</Button><Button type="button" onClick={nativeShare}><Share2 /> Paylaş</Button></div>
      </div>
    </Modal>
  </>;
}
