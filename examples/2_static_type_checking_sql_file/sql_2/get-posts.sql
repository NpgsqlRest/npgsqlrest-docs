-- HTTP GET
select u.username, p.content, p.created_at
from example_2.posts p join example_2.users u using(user_id)
where u.active = true

