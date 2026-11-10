"use client";
import { useState, useTransition } from "react";
import { Pencil, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { renameActiveParticipant } from "./actions";
import styles from "./tournament-page.module.css";

export function ParticipantTab({ tournamentId, participants, status }: { tournamentId:string; participants:{id:string;name:string}[]; status:string }) {
 const [editing,setEditing]=useState<{id:string;name:string}|null>(null),[error,setError]=useState<string>(),[pending,transition]=useTransition(); const canRename=status==="ACTIVE";
 return <section className={styles.tabPanel}><header className={styles.participantHeader}><div><h2>Katılımcılar</h2><p>Turnuvadaki kişi, takım ve diğer katılımcıları görüntüleyin.</p></div><span className={styles.locked}><LockKeyhole/> Ekleme ve silme kilitli</span></header><div className={styles.activeNote}><LockKeyhole/><div><strong>Turnuva başladı</strong><p>Fikstür korunduğu için katılımcı ekleme ve silme yapılamaz. Yazım hatalarını düzeltmek için adı güncelleyebilirsiniz.</p></div></div><section className={styles.participantTable}><header>Toplam {participants.length} katılımcı</header>{participants.map((p,i)=><div key={p.id}><span>{i+1}</span><b>{p.name.charAt(0).toLocaleUpperCase("tr-TR")}</b><strong>{p.name}</strong>{canRename?<button onClick={()=>{setEditing(p);setError(undefined)}} aria-label={`${p.name} adını düzenle`}><Pencil/></button>:<LockKeyhole/>}</div>)}</section><Modal open={!!editing} title="Katılımcı Adını Düzenle" onClose={()=>!pending&&setEditing(null)}>{editing&&<form className={styles.renameForm} action={form=>transition(async()=>{const result=await renameActiveParticipant(tournamentId,editing.id,String(form.get("name")??""));if(result.error)setError(result.error);else setEditing(null);})}><label>Katılımcı adı<input name="name" defaultValue={editing.name} maxLength={50} autoFocus required/></label>{error&&<p role="alert">{error}</p>}<small>Bu değişiklik fikstür ve geçmiş sonuçları korur.</small><footer><Button type="button" variant="secondary" onClick={()=>setEditing(null)}>İptal</Button><Button disabled={pending}>Değişikliği Kaydet</Button></footer></form>}</Modal></section>;
}
