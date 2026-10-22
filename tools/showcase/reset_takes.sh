# Put the showcase data back to the state the clips start from (except the board, which resets on restart).
B=http://127.0.0.1:8791
TOK=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"name":"Layla Haddad","pin":"2468"}' $B/api/login | python -c "import sys,json;print(json.load(sys.stdin)['token'])")
for id in $(curl -s -H "X-Desk-Token: $TOK" $B/api/workflows | python -c "import sys,json;print(' '.join(w['id'] for w in json.load(sys.stdin)['workflows'] if not w['id'].startswith('wf_cv_')))"); do
  curl -s -X DELETE -H "X-Desk-Token: $TOK" $B/api/workflows/$id > /dev/null && echo "removed $id"
done
python - <<'PY'
import os, sqlite3
db = sqlite3.connect(os.path.join(os.environ["TEMP"], "assistall-capture-showcase", "inbox_sentinel.db"))
db.execute("UPDATE drafts SET status='PENDING', decided_by=NULL, decided_at=NULL")
db.commit()
print("drafts pending again")
PY
