// ═════════════════════════════════════════════════════════════════
// CHAT SYSTEM - Real-time Messaging for Bookings
// ═════════════════════════════════════════════════════════════════

let chatListener = null;

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

window.ChatSystem = {
  openChat: function(bookingId, workerName, workerInitials, trade, distanceKm) {
    const modal = document.getElementById('modal-chat');
    document.getElementById('chat-worker-initials').textContent = workerInitials;
    document.getElementById('chat-worker-name').textContent = workerName;
    
    let sub = trade;
    if (window.currentRole === 'worker') {
      sub = `Requested for ${trade}`;
    } else if (window.currentRole === 'user') {
      sub = `${trade} Professional`;
    }
    
    if (distanceKm !== undefined && distanceKm !== 'undefined' && distanceKm !== '') {
      sub += ` · ${distanceKm} km away`;
    }
    document.getElementById('chat-worker-trade').textContent = sub;
    
    document.getElementById('chat-booking-pill').textContent = `${bookingId} · ${trade}`;
    
    const input = document.getElementById('chat-input');
    const firstName = workerName.split(' ')[0];
    input.placeholder = `Message ${firstName}...`;
    input.value = '';
    
    const sendBtn = document.getElementById('chat-send-btn');
    sendBtn.onclick = () => {
      window.ChatSystem.sendMessage(bookingId, input.value);
    };
    
    input.onkeypress = (e) => {
      if (e.key === 'Enter') {
        window.ChatSystem.sendMessage(bookingId, input.value);
      }
    };
    
    if (window.openModal) window.openModal('modal-chat');
    else modal.style.display = 'flex';
    
    window.ChatSystem.loadMessages(bookingId);
  },

  loadMessages: function(bookingId) {
    if (!window.firebase) return;
    const db = window.firebase.firestore();
    const currentUser = window.firebase.auth().currentUser;
    if (!currentUser) return;
    
    if (chatListener) {
      chatListener();
      chatListener = null;
    }
    
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    
    chatListener = db.collection('bookings').doc(bookingId).collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot(snap => {
        container.innerHTML = '';
        snap.forEach(doc => {
          const msg = doc.data();
          const div = document.createElement('div');
          
          if (msg.type === 'system') {
            div.style.cssText = "text-align:center; font-size:0.75rem; color:var(--text-3); margin:12px 0;";
            div.textContent = msg.text;
          } else {
            const isMe = msg.senderId === currentUser.uid;
            div.style.cssText = `display:flex; flex-direction:column; margin-bottom:12px; align-items:${isMe ? 'flex-end' : 'flex-start'};`;
            
            const timeString = msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
            
            const bubbleHtml = `
              <div style="max-width:75%; padding:10px 14px; border-radius:8px; font-size:0.9rem; ${isMe ? 'background:#0d9488; color:white;' : 'background:var(--surface); color:var(--text);'} border:${isMe ? 'none' : '1px solid var(--border)'}; word-wrap:break-word;">
                ${escapeHtml(msg.text)}
              </div>
              <div style="font-size:0.65rem; color:var(--text-3); margin-top:4px;">${timeString}</div>
            `;
            div.innerHTML = bubbleHtml;
          }
          container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
      });
  },

  sendMessage: async function(bookingId, text) {
    if (!text.trim()) return;
    if (!window.firebase) return;
    const db = window.firebase.firestore();
    const currentUser = window.firebase.auth().currentUser;
    if (!currentUser) return;
    
    document.getElementById('chat-input').value = '';
    
    try {
      await db.collection('bookings').doc(bookingId).collection('messages').add({
        text: text.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email.split('@')[0],
        timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
        type: 'user'
      });
    } catch (e) {
      console.error("Message send error:", e);
    }
  },

  postSystemMessage: async function(bookingId, text) {
    if (!window.firebase) return;
    const db = window.firebase.firestore();
    try {
      await db.collection('bookings').doc(bookingId).collection('messages').add({
        text: text,
        timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
        type: 'system'
      });
    } catch (e) {
      console.error("System msg error:", e);
    }
  },
  
  closeChat: function() {
    if (chatListener) {
      chatListener();
      chatListener = null;
    }
    if (window.closeModal) window.closeModal('modal-chat');
  }
};
