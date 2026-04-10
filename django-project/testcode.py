import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "learning_log.settings")


import django
django.setup()



from learning_logs.models import Topic, Entry

topics = Topic.objects.all()

for topic in topics:
    print(topic.id, topic, topic.date_added)
    
    
t  = Topic.objects.get(id=1)
print(t.text)
print(t.date_added)
entries = Entry.objects.filter(topic=t)


entries = t.entry_set.all()


for entry in entries:
    print(entry)
