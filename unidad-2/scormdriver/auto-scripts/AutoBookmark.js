// version: 7.12.0.a.1.6.3
// sha: f24b0b73e1ccf8687ddfbe3c0561cf3888d7a0f6
function SetBookmark(){var o=window.parent,t=window.location.href;o.SetBookmark(t.substring(t.toLowerCase().lastIndexOf("/scormcontent/")+14,t.length),document.title),o.CommitData()}SetBookmark();