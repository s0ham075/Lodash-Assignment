const express = require('express');
const app = express();
const _ = require('lodash');

app.use(async(req,res,next)=>{
    const fetchApiData = async ()=>{
        const options = {
            method: 'GET',
            headers: {'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'}
        };
        const response = await fetch('https://intent-kit-16.hasura.app/api/rest/blogs', options);
        if (!response.ok) throw new Error('Request failed with status: ' + response.status);
        res.locals.data = await response.json();
    }
    try{
    const memoisedFetchData = _.memoize(fetchApiData);
    await memoisedFetchData();
    next();
   } catch(error){
    console.error('Error in middleware:', error);
    res.status(500).json({ error: 'Internal Server Error' });
   }
});

app.get(`/api/blog-stats`,(req,res)=>{
    const blogs = res.locals.data.blogs;
    var privacy_blogs_count = 0;
    var longest_title = '';
    const title_set = new Set([]);

    try{
        const filtered_blogs = _.filter(blogs, blog =>{
            if(_.includes(_.lowerCase(blog.title),"privacy")) privacy_blogs_count++ ;
            if(title_set.has(blog.title)){
                return false;
            }
            else{
                title_set.add(blog.title);
                longest_title = blog.title.length > longest_title.length ? blog.title : longest_title;
                return true ;
            }
        });

        const response = {
            total_blogs : blogs.length,
            longest_title,
            privacy_blogs_count,
            unique_blog_titles : [...title_set]
        }
        res.json(response);
    }
    catch (error) {
        console.error('Error during data analysis:', error);
        res.status(500).json({ error: 'Error during data analysis:' });
    }
})

const searchBlog = (query,blogs)=>{
    const filtered_blogs = _.filter(blogs,blog=>{
        return _.includes(_.lowerCase(blog.title),_.lowerCase(query));
    })
    return filtered_blogs;
}

app.get('/api/blog-search',(req,res)=>{
    try{
        const blogs = res.locals.data.blogs;
        const query = req.query.query;
        const memoisedSearch = _.memoize(searchBlog);
        res.json(memoisedSearch(query,blogs));
    }
    catch (error) {
        console.error('Error during search:', error);
        res.status(500).json({ error: 'Error during search' });
    }
})

app.listen(3000,()=>{
    console.log("app is listening on port 3000");

})